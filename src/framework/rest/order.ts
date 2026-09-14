import {
  CreateOrderInput,
  CreateOrderPaymentInput,
  CreateRefundInput,
  DownloadableFilePaginator,
  Order,
  OrderPaginator,
  OrderQueryOptions,
  OrderShipment,
  PaymentGateway,
  QueryOptions,
  RefundPolicyQueryOptions,
} from "@/types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { useTranslation } from "next-i18next";
import { toast } from "react-toastify";
import { useModalAction } from "@/components/ui/modal/modal.context";
import { API_ENDPOINTS } from "./client/api-endpoints";
import client from "./client";
import { useAtom } from "jotai";
import { clearCheckoutAtom, verifiedResponseAtom } from "@/store/checkout";
import { useCart } from "@/store/quick-cart/cart.context";
import { useRouter } from "@/compat/next-router";
import { Routes } from "@/config/routes";
import { mapPaginatorData } from "@/framework/utils/data-mappers";
import { isArray, isObject, isEmpty } from "lodash";
import { useMemo } from "react";
import { resolveOrderToken, saveOrderToken } from "@/lib/order-token";
import { cartFingerprint } from "@/lib/checkout-totals";
import { firstFieldError, getErrorMessage } from "@/lib/get-error-message";

export function useOrders(options?: Partial<OrderQueryOptions>) {
  const { locale } = useRouter();

  const formattedOptions = {
    ...options,
    // language: locale
  };

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery<OrderPaginator, Error>(
    [API_ENDPOINTS.ORDERS, formattedOptions],
    ({ queryKey, pageParam }) =>
      client.orders.all(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
      refetchOnWindowFocus: false,
    },
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  return {
    orders: data?.pages?.flatMap((page) => page.data) ?? [],
    paginatorInfo: Array.isArray(data?.pages)
      ? mapPaginatorData(data?.pages[data.pages.length - 1])
      : null,
    isLoading,
    error,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    loadMore: handleLoadMore,
    hasMore: Boolean(hasNextPage),
  };
}

export function useOrder({ tracking_number }: { tracking_number: string }) {
  const { query } = useRouter();
  // Guest orders are gated by a per-order token; pull it from the URL (emailed /
  // post-checkout link) or from what we stored at checkout. Owned orders ignore it.
  // The router's server search-snapshot is empty during hydration, so ALSO read
  // window.location directly — otherwise the very first fetch of an emailed link
  // goes out token-less, 404s, and caches an error entry.
  const token = useMemo(() => {
    const fromRouter = query?.token as string | undefined;
    const fromLocation =
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("token") ??
          undefined)
        : undefined;
    return resolveOrderToken(tracking_number, fromRouter ?? fromLocation);
  }, [tracking_number, query?.token]);
  const { data, isLoading, error, isFetching, refetch } = useQuery<
    Order,
    Error
  >(
    [API_ENDPOINTS.ORDERS, tracking_number, token],
    () => client.orders.get(tracking_number, token),
    {
      refetchOnWindowFocus: false,
      // Never fire without a tracking number (the route param can be absent for a frame
      // after a client-side push) — an empty-id request 404s and caches that failure.
      enabled: Boolean(tracking_number),
      // The read immediately after checkout is the one that must not dead-end: a single
      // blip used to leave "We couldn't load this order" until the customer retried by
      // hand. Two bounded retries with backoff, and never retry a real 404/403 — those
      // are answers, not blips.
      retry: (failureCount: number, err: any) => {
        const status = err?.response?.status;
        if (status === 404 || status === 403 || status === 401) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 4000),
    },
  );

  return {
    order: data,
    isFetching,
    isLoading,
    refetch,
    error,
  };
}

/**
 * Per-parcel tracking: the order's shipments (status / courier / ETA / items).
 * Same guest-token plumbing as useOrder; the API returns { shipments: [] } for
 * anything not permitted, so the UI can render nothing without special-casing.
 */
export function useOrderShipments({
  tracking_number,
}: {
  tracking_number?: string;
}) {
  const { query } = useRouter();
  const token = useMemo(
    () =>
      tracking_number
        ? resolveOrderToken(tracking_number, query?.token as string | undefined)
        : undefined,
    [tracking_number, query?.token],
  );
  const { data, isLoading, error } = useQuery<
    { shipments: OrderShipment[] },
    Error
  >(
    [API_ENDPOINTS.ORDERS, tracking_number, "shipments", token],
    () => client.orders.shipments(tracking_number!, token),
    { enabled: Boolean(tracking_number), refetchOnWindowFocus: true, retry: 0 },
  );

  return {
    shipments: data?.shipments ?? [],
    isLoading,
    error,
  };
}

export function useRefunds(options: Pick<QueryOptions, "limit">) {
  const { locale } = useRouter();

  const formattedOptions = {
    ...options,
    // language: locale
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery(
    [API_ENDPOINTS.ORDERS_REFUNDS, formattedOptions],
    ({ queryKey, pageParam }) =>
      client.orders.refunds(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
    },
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  return {
    refunds: data?.pages?.flatMap((page) => page.data) ?? [],
    paginatorInfo: Array.isArray(data?.pages)
      ? mapPaginatorData(data?.pages[data.pages.length - 1])
      : null,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    error,
    loadMore: handleLoadMore,
    hasMore: Boolean(hasNextPage),
  };
}

export const useDownloadableProducts = (
  options: Pick<QueryOptions, "limit">,
) => {
  const { locale } = useRouter();

  const formattedOptions = {
    ...options,
    // language: locale
  };

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery<DownloadableFilePaginator, Error>(
    [API_ENDPOINTS.ORDERS_DOWNLOADS, formattedOptions],
    ({ queryKey, pageParam }) =>
      client.orders.downloadable(Object.assign({}, queryKey[1], pageParam)),
    {
      getNextPageParam: ({ current_page, last_page }) =>
        last_page > current_page && { page: current_page + 1 },
      refetchOnWindowFocus: false,
    },
  );

  function handleLoadMore() {
    fetchNextPage();
  }

  return {
    downloads: data?.pages?.flatMap((page) => page.data) ?? [],
    paginatorInfo: Array.isArray(data?.pages)
      ? mapPaginatorData(data?.pages[data.pages.length - 1])
      : null,
    isLoading,
    isFetching,
    isLoadingMore: isFetchingNextPage,
    error,
    loadMore: handleLoadMore,
    hasMore: Boolean(hasNextPage),
  };
};

export function useCreateRefund() {
  const { t } = useTranslation();
  const { locale } = useRouter();
  const { closeModal } = useModalAction();
  const queryClient = useQueryClient();
  const { mutate: createRefundRequest, isLoading } = useMutation(
    client.orders.createRefund,
    {
      onSuccess: () => {
        toast.success(`${t("text-refund-request-submitted")}`);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(
            error,
            t("text-something-wrong") ??
              "Refund request failed — please try again.",
          ),
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries(API_ENDPOINTS.ORDERS);
        closeModal();
      },
    },
  );

  function formatRefundInput(input: CreateRefundInput) {
    const formattedInputs = {
      ...input,
      // language: locale
    };
    createRefundRequest(formattedInputs);
  }

  return {
    createRefundRequest: formatRefundInput,
    isLoading,
  };
}

export function useCreateOrder() {
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation();
  const { resetCart } = useCart();
  const [, resetCheckout] = useAtom(clearCheckoutAtom);
  const { mutate: createOrder, isLoading } = useMutation(client.orders.create, {
    onSuccess: ({
      tracking_number,
      payment_gateway,
      payment_intent,
      tracking_token,
    }) => {
      if (tracking_number) {
        // The order EXISTS — consume the cart + checkout state HERE, at the moment of
        // creation. This used to live in the shared OrderView, which is also rendered by
        // order HISTORY and the payment page — so merely opening a past order emptied the
        // live cart (D4).
        resetCart();
        //@ts-ignore
        resetCheckout();
        // The wizard position is remembered per session (so a reload keeps the customer's
        // place); clear it here, because the checkout atoms this order just consumed are
        // gone and the NEXT checkout must start at Contact rather than on a Review step
        // with no address.
        try {
          sessionStorage.removeItem("pah-checkout-step");
        } catch {
          /* non-fatal */
        }
        // Persist the per-order token so a guest can view their confirmation,
        // payment and thank-you pages after this redirect (and on reload).
        if (tracking_token) saveOrderToken(tracking_number, tracking_token);
        const tokenQuery = tracking_token
          ? `?token=${encodeURIComponent(tracking_token)}`
          : "";

        if (
          [
            PaymentGateway.COD,
            PaymentGateway.CASH,
            PaymentGateway.FULL_WALLET_PAYMENT,
          ].includes(payment_gateway as PaymentGateway)
        ) {
          return router.push(`${Routes.order(tracking_number)}${tokenQuery}`);
        }

        if (payment_intent?.payment_intent_info?.is_redirect) {
          return router.push(
            payment_intent?.payment_intent_info?.redirect_url as string,
          );
        } else {
          return router.push(
            `${Routes.order(tracking_number)}/payment${tokenQuery}`,
          );
        }
      } else {
        // 200 without a tracking_number: the server answered but we can't navigate. This
        // used to be a SILENT no-op — button re-enabled, no toast, while the order may
        // exist server-side. Say so, and steer away from a blind duplicate retry (D14).
        toast.error(
          'We could not confirm your order. Please check "My Orders" before trying again.',
        );
      }
    },
    onError: (error: any) => {
      // Safe access — the old `const { response: { data } } = error` itself threw inside
      // this handler on a network error with no response (D15).
      const data = error?.response?.data;
      // Shopping-City hard gate (422): the API encodes a structured payload in
      // message — surface the dedicated mismatch dialog instead of a raw toast.
      if (data?.code === "CITY_OUT_OF_STOCK") {
        toast.error(data?.message);
        return;
      }
      try {
        const parsed =
          data?.code === "SHOPPING_CITY_MISMATCH"
            ? data
            : typeof data?.message === "string" &&
                data.message.trim().startsWith("{")
              ? JSON.parse(data.message)
              : null;
        if (parsed?.code === "SHOPPING_CITY_MISMATCH") {
          window.dispatchEvent(
            new CustomEvent("pah-city-mismatch", { detail: parsed }),
          );
          return;
        }
      } catch {
        /* not the gate — fall through to the generic toast */
      }
      // Order-create 422s are BARE field-error bags (no `message` key) — surface
      // the first field message instead of the generic fallback. 503 maintenance
      // and COD_DISABLED carry a `message`, which getErrorMessage shows as-is.
      toast.error(
        firstFieldError(error) ??
          getErrorMessage(
            error,
            "We could not place your order — please try again.",
          ),
      );
    },
  });

  function formatOrderInput(input: CreateOrderInput) {
    const formattedInputs = {
      ...input,
      language: locale,
      invoice_translated_text: {
        subtotal: t("order-sub-total"),
        discount: t("order-discount"),
        tax: t("order-tax"),
        delivery_fee: t("order-delivery-fee"),
        total: t("order-total"),
        products: t("text-products"),
        quantity: t("text-quantity"),
        invoice_no: t("text-invoice-no"),
        date: t("text-date"),
      },
    };
    createOrder(formattedInputs);
  }

  return {
    createOrder: formatOrderInput,
    isLoading,
    // isPaymentIntentLoading
  };
}

export function useGenerateDownloadableUrl() {
  const { mutate: getDownloadableUrl } = useMutation(
    client.orders.generateDownloadLink,
    {
      onSuccess: (data) => {
        function download(fileUrl: string, fileName: string) {
          var a = document.createElement("a");
          a.href = fileUrl;
          a.setAttribute("download", fileName);
          a.click();
        }

        download(data, "record.name");
      },
    },
  );

  function generateDownloadableUrl(digital_file_id: string) {
    getDownloadableUrl({
      digital_file_id,
    });
  }

  return {
    generateDownloadableUrl,
  };
}

export function useVerifyOrder() {
  const [_, setVerifiedResponse] = useAtom(verifiedResponseAtom);

  return useMutation(client.orders.verify, {
    onSuccess: (data, variables: any) => {
      //@ts-ignore
      if (data?.errors as string) {
        //@ts-ignore
        toast.error(data?.errors[0]?.message);
      } else if (data) {
        // Stamp WHAT was verified: the summary/totals stay valid only while the cart
        // matches this fingerprint. verified_response persists in localStorage, and a
        // stale one used to submit yesterday's tax/shipping/amount silently (D8).
        //@ts-ignore
        setVerifiedResponse({
          ...data,
          __fingerprint: cartFingerprint(variables?.products ?? []),
        });
      }
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "We could not verify your cart — please try again.",
        ),
      );
    },
  });
}

export function useOrderPayment() {
  const queryClient = useQueryClient();

  const { mutate: createOrderPayment, isLoading } = useMutation(
    client.orders.payment,
    {
      onSettled: (data) => {
        queryClient.refetchQueries(API_ENDPOINTS.ORDERS);
        queryClient.refetchQueries(API_ENDPOINTS.ORDERS_DOWNLOADS);
      },
      onError: (error) => {
        toast.error(
          getErrorMessage(
            error,
            "Payment could not be processed — please try again.",
          ),
        );
      },
    },
  );

  function formatOrderInput(input: CreateOrderPaymentInput) {
    const formattedInputs = {
      ...input,
    };
    createOrderPayment(formattedInputs);
  }

  return {
    createOrderPayment: formatOrderInput,
    isLoading,
  };
}

export function useSavePaymentMethod() {
  const {
    mutate: savePaymentMethod,
    isLoading,
    error,
    data,
  } = useMutation(client.orders.savePaymentMethod);

  return {
    savePaymentMethod,
    data,
    isLoading,
    error,
  };
}

export function useGetPaymentIntentOriginal({
  tracking_number,
}: {
  tracking_number: string;
}) {
  const router = useRouter();
  const { openModal } = useModalAction();

  const { data, error, refetch, isFetching } = useQuery(
    [API_ENDPOINTS.PAYMENT_INTENT, { tracking_number }],
    () => client.orders.getPaymentIntent({ tracking_number }),
    // Make it dynamic for both gql and rest
    {
      enabled: false,
      onSuccess: (data) => {
        const url = data?.payment_intent_info?.redirect_url;
        if (
          data?.payment_intent_info?.is_redirect &&
          typeof url === "string" &&
          url
        ) {
          return router.push(url);
        } else {
          openModal("PAYMENT_MODAL", {
            paymentGateway: data?.payment_gateway,
            paymentIntentInfo: data?.payment_intent_info,
            trackingNumber: data?.tracking_number,
          });
        }
      },
    },
  );

  return {
    data,
    getPaymentIntentQueryOriginal: refetch,
    // A lazily-enabled (enabled:false) query is status 'pending' forever in
    // TanStack v5, and the compat shim maps isLoading→isPending — which left
    // every consumer's button disabled with a spinner before the first fetch.
    // "Loading" here means "actually fetching".
    isLoading: isFetching,
    error,
  };
}

export function useGetPaymentIntent({
  tracking_number,
  payment_gateway,
  recall_gateway,
  form_change_gateway,
}: {
  tracking_number: string;
  payment_gateway: string;
  recall_gateway?: boolean;
  form_change_gateway?: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { openModal, closeModal } = useModalAction();

  const { data, error, refetch, isFetching } = useQuery(
    [
      API_ENDPOINTS.PAYMENT_INTENT,
      { tracking_number, payment_gateway, recall_gateway },
    ],
    () =>
      client.orders.getPaymentIntent({
        tracking_number,
        payment_gateway,
        recall_gateway,
      }),
    // Make it dynamic for both gql and rest
    {
      enabled: false,
      // A gateway that is down/misconfigured must fail visibly (branded toast),
      // not silently strand the customer on a dead Pay Now button.
      onError: () => {
        toast.error(t("text-payment-unavailable"));
      },
      onSuccess: (item) => {
        let data: any = "";
        if (isArray(item)) {
          data = { ...item };
          data = isEmpty(data) ? [] : data[0];
        } else if (isObject(item)) {
          data = item;
        }
        // A malformed intent (is_redirect with no URL) must never crash the
        // page — router.push(undefined) threw all the way to the route error
        // boundary ("This page didn't load") when a gateway was selected.
        const url = data?.payment_intent_info?.redirect_url;
        if (
          data?.payment_intent_info?.is_redirect &&
          typeof url === "string" &&
          url
        ) {
          return router.push(url);
        } else if (data?.payment_intent_info?.is_redirect) {
          toast.error(t("text-payment-unavailable"));
        } else {
          if (recall_gateway) window.location.reload();
          openModal("PAYMENT_MODAL", {
            paymentGateway: data?.payment_gateway,
            paymentIntentInfo: data?.payment_intent_info,
            trackingNumber: data?.tracking_number,
          });
        }
      },
    },
  );

  return {
    data,
    getPaymentIntentQuery: refetch,
    // See useGetPaymentIntentOriginal: enabled:false ⇒ isPending forever in
    // v5; "loading" for consumers means an actual in-flight fetch.
    isLoading: isFetching,
    fetchAgain: isFetching,
    error,
  };
}
