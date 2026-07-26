import MaintenanceMode from '@/components/maintenance';
import ErrorMessage from '@/components/ui/error-message';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useSettings } from '@/framework/settings';
import {
  adminOnly,
  getAuthCredentials,
  hasAccess,
} from '@/framework/utils/auth-utils';
import {
  NEWSLETTER_POPUP_MODAL_KEY,
  REVIEW_POPUP_MODAL_KEY,
  checkIsMaintenanceModeComing,
  checkIsMaintenanceModeStart,
} from '@/lib/constants';
import { eachMinuteOfInterval, isBefore } from 'date-fns';
import { useAtom } from 'jotai';
import Cookies from 'js-cookie';
import { useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@/framework/user';
import { isEmpty } from 'lodash';
import CountdownTimer from '@/components/ui/countdown-timer/maintenance';
import { useRouter } from '@/compat/next-router';

type MaintenanceProps = {
  children: React.ReactNode;
};

export const isInArray = (array: Date[], value: Date) => {
  return !!array?.find((item) => {
    return item?.getDate() == value?.getDate();
  });
};

const Maintenance = ({ children }: MaintenanceProps) => {
  const { settings, isLoading: settingLoading, error } = useSettings();
  const [_, setUnderMaintenanceIsComing] = useAtom(
    checkIsMaintenanceModeComing,
  );
  const [underMaintenanceStart, setUnderMaintenanceStart] = useAtom(
    checkIsMaintenanceModeStart,
  );

  const { permissions } = getAuthCredentials();
  const AccessAdminRoles = hasAccess(adminOnly, permissions);
  const { openModal } = useModalAction();
  const { me, isLoading } = useUser();
  const router = useRouter();
  const { reload } = router;

  // Use useMemo to avoid recomputing the date interval on every render
  const dateInterVal = useMemo(() => {
    if (
      settings?.maintenance?.start &&
      settings?.maintenance?.until &&
      settings?.isUnderMaintenance
    ) {
      return eachMinuteOfInterval({
        start: new Date(settings?.maintenance?.start),
        end: new Date(settings?.maintenance?.until),
      });
    }
    return [];
  }, [
    settings?.maintenance?.start,
    settings?.maintenance?.until,
    settings?.isUnderMaintenance,
  ]);

  // Use useCallback to avoid creating new functions on every render
  const handleMaintenanceCheck = useCallback(() => {
    if (dateInterVal.length > 0) {
      const beforeDay = isBefore(
        new Date(),
        new Date(settings?.maintenance?.start as string),
      );
      // Calculate maintenance start time
      const maintenanceStartTime = new Date(
        settings?.maintenance?.start as string,
      );
      const maintenanceEndTime = new Date(
        settings?.maintenance?.until as string,
      );
      maintenanceStartTime.setMinutes(maintenanceStartTime.getMinutes());
      // Check if the current time has passed the maintenance start time
      const currentTime = new Date();
      const checkIsMaintenanceStart =
        currentTime >= maintenanceStartTime &&
        currentTime < maintenanceEndTime &&
        settings?.isUnderMaintenance;
      const checkIsMaintenance = beforeDay && settings?.isUnderMaintenance;
      setUnderMaintenanceStart(checkIsMaintenanceStart as boolean);
      setUnderMaintenanceIsComing(checkIsMaintenance as boolean);
    }
  }, [
    dateInterVal,
    settings?.isUnderMaintenance,
    settings?.maintenance?.start,
    settings?.maintenance?.until,
  ]);

  // Use useEffect to run the maintenance check only once
  useEffect(() => {
    handleMaintenanceCheck();
  }, [handleMaintenanceCheck]);

  let seenPopup = Cookies.get(NEWSLETTER_POPUP_MODAL_KEY);
  let seenReviewPopup = Cookies.get(REVIEW_POPUP_MODAL_KEY);

  // Use useCallback to avoid creating new functions on every render
  const handlePromoPopup = useCallback(() => {
    if (
      Boolean(settings?.isPromoPopUp) &&
      !underMaintenanceStart &&
      !AccessAdminRoles &&
      !Boolean(seenPopup)
    ) {
      let timer = setTimeout(
        () =>
          openModal('PROMO_POPUP_MODAL', {
            isLoading: settingLoading,
            popupData: settings?.promoPopup,
          }),
        Number(settings?.promoPopup?.popUpDelay),
      );
      return () => clearTimeout(timer);
    }
  }, [
    settings?.isPromoPopUp,
    settings?.promoPopup?.popUpDelay,
    underMaintenanceStart,
    AccessAdminRoles,
    settingLoading,
    seenPopup,
  ]);

  // Use useEffect to run the promo popup only once
  useEffect(() => {
    handlePromoPopup();
  }, [handlePromoPopup]);

  // Use useCallback to avoid creating new functions on every render
  const handleReviewPopup = useCallback(() => {
    if (
      me &&
      me?.last_order &&
      isEmpty(me?.last_order?.reviews) &&
      Boolean(settings?.enableReviewPopup) &&
      !underMaintenanceStart &&
      !AccessAdminRoles &&
      !Boolean(seenReviewPopup) &&
      Boolean(seenPopup)
    ) {
      let timer = setTimeout(() => {
        openModal('REVIEW_POPUP_MODAL', {
          tracking_number: me?.last_order?.tracking_number,
        });
      }, Number(5000));
      return () => clearTimeout(timer);
    }
  }, [
    seenReviewPopup,
    underMaintenanceStart,
    AccessAdminRoles,
    settings?.enableReviewPopup,
    seenPopup,
    isLoading,
  ]);

  // Use useEffect to run the review popup only once
  useEffect(() => {
    handleReviewPopup();
  }, [handleReviewPopup]);

  // ── The old gate: `if (settingLoading) return <Spinner />` ──────────────
  // REMOVED. That single line made EVERY prerendered route an empty spinner:
  // this component wraps {children} at the app-providers root, and during
  // prerender the settings query is always loading, so the ~168KB HTML Next
  // emitted for the home page contained zero product markup — no <h1> copy,
  // no add-to-cart, nothing for a non-JS crawler, and an LCP that could not
  // begin until the client bundle booted and fetched settings. Rendering
  // through is safe because useSettings() returns `{}` (never undefined)
  // while loading, and every consumer reads it with optional chaining or
  // single-level access; the promo/review/maintenance effects above already
  // no-op on empty settings. Anything that DOES need a loading state now has
  // route-level loading.tsx / error.tsx boundaries to express it.
  //
  // The error return is kept, but only when there is genuinely nothing to
  // render: useSettings refetches on every mount, and with react-query a
  // BACKGROUND refetch failure sets `error` while cached data is still
  // present — the old unconditional return replaced a fully working page
  // with a full-screen error whenever one background refetch flaked.
  if (error && isEmpty(settings)) {
    return <ErrorMessage message={error.message} />;
  }

  if (underMaintenanceStart && !AccessAdminRoles) {
    return (
      <main
        className={`${settings?.siteTitle}-version-${process?.env?.NEXT_PUBLIC_VERSION}`}
      >
        <MaintenanceMode
          data={{
            aboutUsTitle: settings?.maintenance?.aboutUsTitle,
            aboutUsDescription: settings?.maintenance?.aboutUsDescription,
            contactUsTitle: settings?.maintenance?.contactUsTitle,
            contactDetails: settings?.contactDetails,
            title: settings?.maintenance?.title,
            description: settings?.maintenance?.description,
            buttonTitleOne: settings?.maintenance?.buttonTitleOne,
            buttonTitleTwo: settings?.maintenance?.buttonTitleTwo,
            image: settings?.maintenance?.image,
            isOverlayColor: settings?.maintenance?.isOverlayColor,
            overlayColorRange: settings?.maintenance?.overlayColorRange,
          }}
          renderCountDown={
            <div className="mt-7 lg:mt-14">
              <CountdownTimer
                date={
                  new Date(
                    settings?.maintenance?.start
                      ? (settings?.maintenance?.until as string)
                      : (settings?.maintenance?.start as string),
                  )
                }
                onComplete={() => reload()}
              />
            </div>
          }
        />
      </main>
    );
  }
  return (
    <main
      className={`${settings?.siteTitle}-version-${process?.env?.NEXT_PUBLIC_VERSION}`}
    >
      {children}
    </main>
  );
};

export default Maintenance;
