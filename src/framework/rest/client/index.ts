import type {
  Attachment,
  Author,
  AuthorPaginator,
  AuthorQueryOptions,
  AuthResponse,
  Category,
  CategoryPaginator,
  CategoryQueryOptions,
  ChangePasswordUserInput,
  CheckoutVerificationInput,
  CouponPaginator,
  CouponQueryOptions,
  CreateAbuseReportInput,
  CreateContactUsInput,
  CreateFeedbackInput,
  CreateOrderInput,
  CreateQuestionInput,
  CreateRefundInput,
  CreateReviewInput,
  DownloadableFilePaginator,
  Feedback,
  ForgotPasswordUserInput,
  LoginUserInput,
  Manufacturer,
  ManufacturerPaginator,
  ManufacturerQueryOptions,
  MyQuestionQueryOptions,
  MyReportsQueryOptions,
  Order,
  OrderPaginator,
  OrderQueryOptions,
  OrderShipment,
  OrderStatusPaginator,
  OtpLoginInputType,
  OTPResponse,
  PasswordChangeResponse,
  PopularProductQueryOptions,
  Product,
  ProductPaginator,
  ProductQueryOptions,
  QueryOptions,
  QuestionPaginator,
  QuestionQueryOptions,
  Refund,
  RefundPaginator,
  RegisterUserInput,
  ResetPasswordUserInput,
  Review,
  ReviewPaginator,
  ReviewQueryOptions,
  ReviewResponse,
  SendOtpCodeInputType,
  Settings,
  Shop,
  ShopPaginator,
  ShopQueryOptions,
  SocialLoginInputType,
  TagPaginator,
  TagQueryOptions,
  Type,
  TypeQueryOptions,
  UpdateReviewInput,
  UpdateUserInput,
  User,
  VerifiedCheckoutData,
  VerifyCouponInputType,
  VerifyCouponResponse,
  VerifyForgotPasswordUserInput,
  VerifyOtpInputType,
  Wishlist,
  WishlistPaginator,
  WishlistQueryOptions,
  GetParams,
  SettingsQueryOptions,
  CreateOrderPaymentInput,
  SetupIntentInfo,
  PaymentIntentCollection,
  Card,
  BestSellingProductQueryOptions,
  UpdateEmailUserInput,
  EmailChangeResponse,
  VerificationEmailUserInput,
  StoreNoticeQueryOptions,
  StoreNoticePaginator,
  StoreNotice,
  FAQS,
  FaqsQueryOptions,
  FaqsPaginator,
  ShopMapLocation,
  RefundQueryOptions,
  RefundReasonPaginator,
  TermsAndConditionsQueryOptions,
  TermsAndConditionsPaginator,
  FlashSaleQueryOptions,
  FlashSalePaginator,
  FlashSale,
  RefundPolicyPaginator,
  RefundPolicyQueryOptions,
  SingleFlashSale,
  FlashSaleProductsQueryOptions,
  NotifyLogsQueryOptions,
  NotifyLogsPaginator,
  NotifyLogs,
  ShopMaintenanceEvent,
} from '@/types';
import { API_ENDPOINTS } from './api-endpoints';
import { HttpClient } from './http-client';
//@ts-ignore
import { OTPVerifyResponse } from '@/types';

class Client {
  products = {
    all: ({
      type,
      categories,
      name,
      shop_id,
      author,
      manufacturer,
      min_price,
      max_price,
      tags,
      sunlight,
      water,
      placement,
      growth,
      pet_friendly,
      sizes,
      difficulty,
      terms,
      ...params
    }: Partial<ProductQueryOptions>) =>
      HttpClient.get<ProductPaginator>(API_ENDPOINTS.PRODUCTS, {
        searchJoin: 'and',
        with: 'type;author',
        // Never show unpriced catalogue entries (imported names awaiting vendor
        // rates) as buyable ₹0 cards on any customer surface incl. search.
        hide_unpriced: 1,
        ...params,
        search: HttpClient.formatSearchParams({
          type,
          categories,
          name,
          shop_id,
          author,
          manufacturer,
          min_price,
          max_price,
          tags,
          // Botanical facets — filtered through the plantAttribute relation
          // ('in' fields server-side, so comma-joined multi-values work).
          // pet_friendly is boolean; the API coerces true/1/yes and DROPS
          // anything unparseable rather than 500ing under MySQL STRICT.
          'plantAttribute.sunlight': sunlight,
          'plantAttribute.water_requirement': water,
          'plantAttribute.indoor_outdoor': placement,
          'plantAttribute.growth_rate': growth,
          'plantAttribute.pet_friendly': pet_friendly,
          'plantAttribute.difficulty_level': difficulty,
          // Admin-defined characteristics (Suitable Spaces, Special Characteristics, and
          // anything an admin adds later). ONE param carries every dynamic facet as a
          // comma-joined term-slug list, so a new attribute needs no client change.
          'plantTerms.slug': terms,
          // The Size axis (Small/Medium/Large) lives on variations.
          'variations.value': sizes,
          status: 'publish',
          visibility: 'visibility_public',
        }),
      }),
    /** Filter-rail options: distinct attribute values + counts + the price
     *  histogram, scoped exactly like the public list. */
    filterFacets: () =>
      HttpClient.get<import('@/types').FilterFacets>(API_ENDPOINTS.PRODUCTS_FILTER_FACETS),
    popular: (params: Partial<PopularProductQueryOptions>) =>
      HttpClient.get<Product[]>(API_ENDPOINTS.PRODUCTS_POPULAR, params),

    bestSelling: (params: Partial<BestSellingProductQueryOptions>) =>
      HttpClient.get<Product[]>(API_ENDPOINTS.BEST_SELLING_PRODUCTS, params),

    questions: ({ question, ...params }: QuestionQueryOptions) =>
      HttpClient.get<QuestionPaginator>(API_ENDPOINTS.PRODUCTS_QUESTIONS, {
        searchJoin: 'and',
        ...params,
        search: HttpClient.formatSearchParams({
          question,
        }),
      }),

    // `city` drives the API's per-variant city pricing on the PDP — without it
    // the detail page renders master catalogue prices while the card that
    // opened it shows the city price.
    get: ({ slug, language, city }: GetParams & { city?: string }) =>
      HttpClient.get<Product>(`${API_ENDPOINTS.PRODUCTS}/${slug}`, {
        language,
        ...(city ? { city } : {}),
        searchJoin: 'and',
        with: 'categories;shop;type;variations;variations.attribute.values;variation_options;tags',
      }),

    createFeedback: (input: CreateFeedbackInput) =>
      HttpClient.post<Feedback>(API_ENDPOINTS.FEEDBACK, input),
    createAbuseReport: (input: CreateAbuseReportInput) =>
      HttpClient.post<Review>(
        API_ENDPOINTS.PRODUCTS_REVIEWS_ABUSE_REPORT,
        input,
      ),
    createQuestion: (input: CreateQuestionInput) =>
      HttpClient.post<Review>(API_ENDPOINTS.PRODUCTS_QUESTIONS, input),
    getProductsByFlashSale: ({ slug, language }: GetParams) => {
      return HttpClient.get<Product>(
        `${API_ENDPOINTS.PRODUCTS_BY_FLASH_SALE}`,
        {
          language,
          slug,
        },
      );
    },
  };
  myQuestions = {
    all: (params: MyQuestionQueryOptions) =>
      HttpClient.get<QuestionPaginator>(API_ENDPOINTS.MY_QUESTIONS, {
        with: 'user',
        orderBy: 'created_at',
        sortedBy: 'desc',
        ...params,
      }),
  };
  myReports = {
    all: (params: MyReportsQueryOptions) =>
      HttpClient.get<QuestionPaginator>(API_ENDPOINTS.MY_REPORTS, {
        with: 'user',
        orderBy: 'created_at',
        sortedBy: 'desc',
        ...params,
      }),
  };
  reviews = {
    all: ({ rating, ...params }: ReviewQueryOptions) =>
      HttpClient.get<ReviewPaginator>(API_ENDPOINTS.PRODUCTS_REVIEWS, {
        searchJoin: 'and',
        with: 'user',
        ...params,
        search: HttpClient.formatSearchParams({
          rating,
        }),
      }),
    get: ({ id }: { id: string }) =>
      HttpClient.get<Review>(`${API_ENDPOINTS.PRODUCTS_REVIEWS}/${id}`),
    create: (input: CreateReviewInput) =>
      HttpClient.post<ReviewResponse>(API_ENDPOINTS.PRODUCTS_REVIEWS, input),
    update: (input: UpdateReviewInput) =>
      HttpClient.put<ReviewResponse>(
        `${API_ENDPOINTS.PRODUCTS_REVIEWS}/${input.id}`,
        input,
      ),
  };
  categories = {
    all: ({ type, ...params }: Partial<CategoryQueryOptions>) =>
      HttpClient.get<CategoryPaginator>(API_ENDPOINTS.CATEGORIES, {
        searchJoin: 'and',
        ...params,
        ...(type && { search: HttpClient.formatSearchParams({ type }) }),
      }),
    get: ({ slug, language }: GetParams) =>
      HttpClient.get<Category>(`${API_ENDPOINTS.CATEGORIES}/${slug}`, {
        language,
        with: 'type',
      }),
  };
  tags = {
    all: ({ type, ...params }: Partial<TagQueryOptions>) =>
      HttpClient.get<TagPaginator>(API_ENDPOINTS.TAGS, {
        searchJoin: 'and',
        ...params,
        ...(type && { search: HttpClient.formatSearchParams({ type }) }),
      }),
  };
  types = {
    all: (params?: Partial<TypeQueryOptions>) =>
      HttpClient.get<Type[]>(API_ENDPOINTS.TYPES, params),
    get: ({ slug, language }: { slug: string; language: string }) =>
      HttpClient.get<Type>(`${API_ENDPOINTS.TYPES}/${slug}`, { language }),
  };
  shops = {
    all: (params: Partial<ShopQueryOptions>) =>
      HttpClient.get<ShopPaginator>(API_ENDPOINTS.SHOPS, {
        search: HttpClient.formatSearchParams({
          is_active: '1',
        }),
        ...params,
      }),
    get: (slug: string) =>
      HttpClient.get<Shop>(`${API_ENDPOINTS.SHOPS}/${slug}`),

    searchNearShops: (input: ShopMapLocation) =>
      HttpClient.get<any>(API_ENDPOINTS.NEAR_SHOPS, input),

    getSearchNearShops: ({ lat, lng }: ShopMapLocation) =>
      HttpClient.get<any>(`${API_ENDPOINTS.NEAR_SHOPS}/${lat}/${lng}`),

    shopMaintenanceEvent: ({
      shop_id,
      isMaintenance,
      isShopUnderMaintenance,
    }: ShopMaintenanceEvent) =>
      HttpClient.post<Shop>(API_ENDPOINTS.SHOP_MAINTENANCE_EVENT, {
        shop_id,
        isMaintenance,
        isShopUnderMaintenance,
      }),
  };
  storeNotice = {
    all: ({ shop_id, shops, ...params }: Partial<StoreNoticeQueryOptions>) => {
      return HttpClient.get<StoreNoticePaginator>(API_ENDPOINTS.STORE_NOTICES, {
        searchJoin: 'and',
        shop_id: shop_id,
        ...params,
        search: HttpClient.formatSearchParams({ shop_id, shops }),
      });
    },
  };
  authors = {
    all: ({ name, ...params }: Partial<AuthorQueryOptions>) => {
      return HttpClient.get<AuthorPaginator>(API_ENDPOINTS.AUTHORS, {
        ...params,
        searchJoin: 'and',
        search: HttpClient.formatSearchParams({
          name,
        }),
      });
    },
    top: ({ type, ...params }: Partial<AuthorQueryOptions>) =>
      HttpClient.get<Author[]>(API_ENDPOINTS.AUTHORS_TOP, {
        ...params,
        search: HttpClient.formatSearchParams({
          type,
        }),
      }),
    get: ({ slug, language }: { slug: string; language?: string }) =>
      HttpClient.get<Author>(`${API_ENDPOINTS.AUTHORS}/${slug}`, {
        language,
      }),
  };
  manufacturers = {
    all: ({ name, type, ...params }: Partial<ManufacturerQueryOptions>) =>
      HttpClient.get<ManufacturerPaginator>(API_ENDPOINTS.MANUFACTURERS, {
        ...params,
        search: HttpClient.formatSearchParams({
          name,
          type,
        }),
      }),
    top: ({ type, ...params }: Partial<ManufacturerQueryOptions>) =>
      HttpClient.get<Manufacturer[]>(API_ENDPOINTS.MANUFACTURERS_TOP, {
        ...params,
        search: HttpClient.formatSearchParams({
          type,
        }),
      }),
    get: ({ slug, language }: { slug: string; language?: string }) =>
      HttpClient.get<Manufacturer>(`${API_ENDPOINTS.MANUFACTURERS}/${slug}`, {
        language,
      }),
  };
  coupons = {
    all: (params: Partial<CouponQueryOptions>) =>
      HttpClient.get<CouponPaginator>(API_ENDPOINTS.COUPONS, params),
    verify: (input: VerifyCouponInputType) =>
      HttpClient.post<VerifyCouponResponse>(
        API_ENDPOINTS.COUPONS_VERIFY,
        input,
      ),
  };
  orders = {
    all: (params: Partial<OrderQueryOptions>) =>
      HttpClient.get<OrderPaginator>(API_ENDPOINTS.ORDERS, {
        with: 'refund',
        ...params,
      }),
    get: (tracking_number: string, token?: string) =>
      HttpClient.get<Order>(`${API_ENDPOINTS.ORDERS}/${tracking_number}`, {
        with: 'refund;reviews',
        // Guest orders require their per-order token; harmless for owned orders.
        ...(token ? { token } : {}),
      }),
    // Per-parcel tracking: each shipment's status/courier/ETA + items. Guest orders
    // are gated by the same per-order token; any failure returns { shipments: [] }.
    shipments: (tracking_number: string, token?: string) =>
      HttpClient.get<{ shipments: OrderShipment[] }>(
        `${API_ENDPOINTS.ORDERS}/${tracking_number}/shipments`,
        token ? { token } : {},
      ),
    create: ({ __idempotency_key, ...input }: CreateOrderInput & { __idempotency_key?: string }) =>
      HttpClient.post<Order>(
        API_ENDPOINTS.ORDERS,
        input,
        // Checkout idempotency: the server dedupes duplicate submissions on
        // this header (double-click / retry ⇒ the original order comes back).
        __idempotency_key
          ? { headers: { 'Idempotency-Key': __idempotency_key } }
          : undefined,
      ),
    refunds: (params: Pick<QueryOptions, 'limit'>) =>
      HttpClient.get<RefundPaginator>(API_ENDPOINTS.ORDERS_REFUNDS, {
        with: 'refund_policy;order',
        ...params,
      }),
    createRefund: (input: CreateRefundInput) =>
      HttpClient.post<Refund>(API_ENDPOINTS.ORDERS_REFUNDS, input),
    payment: (input: CreateOrderPaymentInput) =>
      HttpClient.post<any>(API_ENDPOINTS.ORDERS_PAYMENT, input),
    savePaymentMethod: (input: any) =>
      HttpClient.post<any>(API_ENDPOINTS.SAVE_PAYMENT_METHOD, input),

    downloadable: (query?: OrderQueryOptions) =>
      HttpClient.get<DownloadableFilePaginator>(
        API_ENDPOINTS.ORDERS_DOWNLOADS,
        query,
      ),
    verify: (input: CheckoutVerificationInput) =>
      HttpClient.post<VerifiedCheckoutData>(
        API_ENDPOINTS.ORDERS_CHECKOUT_VERIFY,
        input,
      ),
    generateDownloadLink: (input: { digital_file_id: string }) =>
      HttpClient.post<string>(
        API_ENDPOINTS.GENERATE_DOWNLOADABLE_PRODUCT_LINK,
        input,
      ),
    getPaymentIntentOriginal: ({
      tracking_number,
    }: {
      tracking_number: string;
    }) =>
      HttpClient.get<PaymentIntentCollection>(API_ENDPOINTS.PAYMENT_INTENT, {
        tracking_number,
      }),
    getPaymentIntent: ({
      tracking_number,
      payment_gateway,
      recall_gateway,
    }: {
      tracking_number: string;
      payment_gateway?: string;
      recall_gateway?: boolean;
    }) =>
      HttpClient.get<PaymentIntentCollection>(API_ENDPOINTS.PAYMENT_INTENT, {
        tracking_number,
        payment_gateway,
        recall_gateway,
      }),
  };
  refundReason = {
    all: ({ type, ...params }: Partial<RefundQueryOptions>) =>
      HttpClient.get<RefundReasonPaginator>(API_ENDPOINTS.REFUNDS_REASONS, {
        searchJoin: 'and',
        ...params,
        ...(type && { search: HttpClient.formatSearchParams({ type }) }),
      }),
  };
  // Routed address CRUD (POST /address, PUT /address/{id}) — replaces the
  // legacy PUT /users/:id address-array save path. DELETE lives in users below.
  address = {
    create: (input: Record<string, any>) =>
      HttpClient.post<any>(API_ENDPOINTS.USERS_ADDRESS, input),
    update: ({ id, ...input }: Record<string, any> & { id: string | number }) =>
      HttpClient.put<any>(`${API_ENDPOINTS.USERS_ADDRESS}/${id}`, input),
  };
  users = {
    me: () => HttpClient.get<User>(API_ENDPOINTS.USERS_ME),
    update: (user: UpdateUserInput) =>
      HttpClient.put<User>(`${API_ENDPOINTS.USERS}/${user.id}`, user),
    login: (input: LoginUserInput) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.USERS_LOGIN, input),
    socialLogin: (input: SocialLoginInputType) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.SOCIAL_LOGIN, input),
    sendOtpCode: (input: SendOtpCodeInputType) =>
      HttpClient.post<OTPResponse>(API_ENDPOINTS.SEND_OTP_CODE, input),
    verifyOtpCode: (input: VerifyOtpInputType) =>
      HttpClient.post<OTPVerifyResponse>(API_ENDPOINTS.VERIFY_OTP_CODE, input),
    OtpLogin: (input: OtpLoginInputType) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.OTP_LOGIN, input),
    register: (input: RegisterUserInput) =>
      HttpClient.post<AuthResponse>(API_ENDPOINTS.USERS_REGISTER, input),
    forgotPassword: (input: ForgotPasswordUserInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_FORGOT_PASSWORD,
        input,
      ),
    verifyForgotPasswordToken: (input: VerifyForgotPasswordUserInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_VERIFY_FORGOT_PASSWORD_TOKEN,
        input,
      ),
    resetPassword: (input: ResetPasswordUserInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_RESET_PASSWORD,
        input,
      ),
    changePassword: (input: ChangePasswordUserInput) =>
      HttpClient.post<PasswordChangeResponse>(
        API_ENDPOINTS.USERS_CHANGE_PASSWORD,
        input,
      ),
    updateEmail: (input: UpdateEmailUserInput) =>
      HttpClient.post<EmailChangeResponse>(
        API_ENDPOINTS.USERS_UPDATE_EMAIL,
        input,
      ),
    logout: () => HttpClient.post<boolean>(API_ENDPOINTS.USERS_LOGOUT, {}),
    deleteAddress: ({ id }: { id: string }) =>
      HttpClient.delete<boolean>(`${API_ENDPOINTS.USERS_ADDRESS}/${id}`),
    subscribe: (input: { email: string }) =>
      HttpClient.post<any>(API_ENDPOINTS.USERS_SUBSCRIBE_TO_NEWSLETTER, input),
    contactUs: (input: CreateContactUsInput) =>
      HttpClient.post<any>(API_ENDPOINTS.USERS_CONTACT_US, input),
    resendVerificationEmail: () => {
      return HttpClient.post<VerificationEmailUserInput>(
        API_ENDPOINTS.SEND_VERIFICATION_EMAIL,
        {},
      );
    },
  };
  wishlist = {
    all: (params: WishlistQueryOptions) =>
      HttpClient.get<WishlistPaginator>(API_ENDPOINTS.USERS_WISHLIST, {
        with: 'shop',
        orderBy: 'created_at',
        sortedBy: 'desc',
        ...params,
      }),
    toggle: (input: { product_id: string; language?: string }) =>
      HttpClient.post<{ in_wishlist: boolean }>(
        API_ENDPOINTS.USERS_WISHLIST_TOGGLE,
        input,
      ),
    remove: (id: string) =>
      HttpClient.delete<Wishlist>(`${API_ENDPOINTS.WISHLIST}/${id}`),
    checkIsInWishlist: ({ product_id }: { product_id: string }) =>
      HttpClient.get<boolean>(
        `${API_ENDPOINTS.WISHLIST}/in_wishlist/${product_id}`,
      ),
  };
  settings = {
    all: (params?: SettingsQueryOptions) =>
      HttpClient.get<Settings>(API_ENDPOINTS.SETTINGS, { ...params }),
    upload: (input: File[]) => {
      let formData = new FormData();
      input.forEach((attachment) => {
        formData.append('attachment[]', attachment);
      });
      return HttpClient.post<Attachment[]>(API_ENDPOINTS.UPLOADS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  };
  cards = {
    all: (params?: any) =>
      HttpClient.get<Card[]>(API_ENDPOINTS.CARDS, { ...params }),
    remove: ({ id }: { id: string }) =>
      HttpClient.delete<any>(`${API_ENDPOINTS.CARDS}/${id}`),
    addPaymentMethod: (method_key: any) =>
      HttpClient.post<any>(API_ENDPOINTS.CARDS, method_key),
    makeDefaultPaymentMethod: (input: any) =>
      HttpClient.post<any>(API_ENDPOINTS.SET_DEFAULT_CARD, input),
  };

  faqs = {
    // all: (params?: any) =>
    //   HttpClient.get<FAQS[]>(API_ENDPOINTS.FAQS, { ...params }),
    all: ({ faq_type, issued_by, ...params }: Partial<FaqsQueryOptions>) =>
      HttpClient.get<FaqsPaginator>(API_ENDPOINTS.FAQS, {
        ...params,
        search: HttpClient.formatSearchParams({
          faq_type,
          issued_by,
        }),
      }),
    get: (id: string) => HttpClient.get<FAQS>(`${API_ENDPOINTS.FAQS}/${id}`),
  };

  termsAndConditions = {
    // all: (params?: any) =>
    //   HttpClient.get<FAQS[]>(API_ENDPOINTS.FAQS, { ...params }),
    all: ({
      type,
      issued_by,
      ...params
    }: Partial<TermsAndConditionsQueryOptions>) =>
      HttpClient.get<TermsAndConditionsPaginator>(
        API_ENDPOINTS.TERMS_AND_CONDITIONS,
        {
          searchJoin: 'and',
          ...params,
          search: HttpClient.formatSearchParams({
            type,
            issued_by,
          }),
        },
      ),
    get: (id: string) =>
      HttpClient.get<FAQS>(`${API_ENDPOINTS.TERMS_AND_CONDITIONS}/${id}`),
  };
  flashSale = {
    // all: (params?: any) =>
    //   HttpClient.get<FAQS[]>(API_ENDPOINTS.FAQS, { ...params }),
    all: ({ ...params }: Partial<FlashSaleQueryOptions>) =>
      HttpClient.get<FlashSalePaginator>(API_ENDPOINTS.FLASH_SALE, {
        ...params,
      }),
    get: ({ slug, language }: { slug: string; language?: string }) => {
      return HttpClient.get<FlashSale>(`${API_ENDPOINTS.FLASH_SALE}/${slug}`, {
        language,
        with: 'products',
      });
    },
    getProductsByFlashSale: ({
      slug,
      ...params
    }: FlashSaleProductsQueryOptions) => {
      return HttpClient.get<ProductPaginator>(
        API_ENDPOINTS.PRODUCTS_BY_FLASH_SALE,
        {
          searchJoin: 'and',
          slug,
          ...params,
        },
      );
    },
  };

  refundPolicies = {
    all: ({
      title,
      status,
      target,
      ...params
    }: Partial<RefundPolicyQueryOptions>) =>
      HttpClient.get<RefundPolicyPaginator>(API_ENDPOINTS.REFUND_POLICIES, {
        searchJoin: 'and',
        ...params,
        search: HttpClient.formatSearchParams({
          title,
          target,
          status,
        }),

        with: 'shop;refunds',
      }),
  };
  notifyLogs = {
    all: (params: Partial<NotifyLogsQueryOptions>) =>
      HttpClient.get<NotifyLogsPaginator>(API_ENDPOINTS.NOTIFY_LOGS, {
        ...params,
      }),

    get: ({ id, language }: { id: string; language?: string }) => {
      return HttpClient.get<NotifyLogs>(`${API_ENDPOINTS.NOTIFY_LOGS}/${id}`, {
        language,
      });
    },
    readNotifyLog: (input: { id: string }) =>
      HttpClient.post<NotifyLogs>(API_ENDPOINTS.READ_NOTIFY_LOG, input),
    readAllNotifyLogs: ({ ...params }: Partial<NotifyLogsQueryOptions>) => {
      return HttpClient.post<any>(API_ENDPOINTS.READ_ALL_NOTIFY_LOG, {
        ...params,
      });
    },
  };
}

const client = new Client();

export default client;
