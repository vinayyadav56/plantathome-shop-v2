import { isNegative } from '@/lib/is-negative';
import usePrice from '@/lib/use-price';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { payableAmountAtom, walletAtom } from '@/store/checkout';
import Checkbox from '@/components/ui/forms/checkbox/checkbox';
import { useTranslation } from 'next-i18next';
interface Props {
  totalPrice: number;
  walletAmount: number;
  walletCurrency: number;
}

const Wallet = ({ totalPrice, walletAmount, walletCurrency }: Props) => {
  const { t } = useTranslation('common');
  const [use_wallet, setUseWallet] = useAtom(walletAtom);
  const [calculatePayableAmount, setCalculatePayableAmount] =
    useAtom(payableAmountAtom);
  const [calculateCurrentWalletCurrency, setCalculateCurrentWalletCurrency] =
    useState(walletCurrency);

  const { price: currentWalletCurrency } = usePrice({
    amount: Number(calculateCurrentWalletCurrency),
  });
  const { price: payableAmount } = usePrice({
    amount: calculatePayableAmount,
  });
  // Capped at the order total: a wallet bigger than the basket only ever spends the basket.
  const { price: appliedAmount } = usePrice({
    amount: Math.min(walletCurrency, totalPrice),
  });
  useEffect(() => {
    if (use_wallet) {
      const calculatedCurrentWalletCurrencyAfterPayment =
        walletCurrency - totalPrice;
      if (isNegative(calculatedCurrentWalletCurrencyAfterPayment)) {
        setCalculateCurrentWalletCurrency(0);
        setCalculatePayableAmount(
          Math.abs(calculatedCurrentWalletCurrencyAfterPayment)
        );
      } else {
        setCalculateCurrentWalletCurrency(
          calculatedCurrentWalletCurrencyAfterPayment
        );
        setCalculatePayableAmount(0);
      }
    } else {
      setCalculateCurrentWalletCurrency(walletCurrency);
      setCalculatePayableAmount(0);
    }
  }, [setCalculatePayableAmount, totalPrice, use_wallet, walletCurrency]);

  return (
    <div>
      {/* ONE balance, stated in money.
          This used to be two rows — "Wallet points 100" above "Wallet currency ₹33.33" —
          two different numbers for one balance with nothing saying which of them gets
          deducted. They differ because currencyToWalletRatio is 3 in production, so the
          points figure is never the amount taken off the order. Money leads; the points
          follow in muted text as the unit they are held in. */}
      <div className="mt-2">
        <div className="flex justify-between text-sm text-body">
          <span>{t('text-wallet')}</span>
          <span className="text-end">
            {currentWalletCurrency}
            <span className="ms-1.5 text-xs text-body/60">
              ({walletAmount} <span className="lowercase">{t('text-points')}</span>)
            </span>
          </span>
        </div>
      </div>

      <Checkbox
        name="use_wallet"
        label={t('text-wallet-use')}
        className="mt-3"
        onChange={setUseWallet}
        checked={use_wallet}
        disabled={!walletAmount}
      />

      {use_wallet && (
        <div className="mt-4 border-t-4 border-double border-border-base pt-3">
          {/* What the wallet actually takes off — the number the shopper was left to
              work out for themselves, and the one that has to agree with the amount the
              gateway then asks for. */}
          <div className="mb-1 flex justify-between text-sm text-body">
            <span>{t('text-wallet')}</span>
            <span>&minus;{appliedAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base font-semibold text-heading">
              {t('text-payable')}
            </span>
            <span className="text-base font-semibold text-heading">
              {payableAmount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
