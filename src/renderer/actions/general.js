// @flow
import { BigNumber } from "bignumber.js";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { OutputSelector } from "reselect";
import { createSelector } from "reselect";
import type { Currency, Account } from "@ledgerhq/live-common/lib/types";
import { isAccountDelegating } from "@ledgerhq/live-common/lib/families/tezos/bakers";
import {
  nestedSortAccounts,
  flattenSortAccounts,
  sortAccountsComparatorFromOrder,
} from "@ledgerhq/live-common/lib/account";
import { getAssetsDistribution } from "@ledgerhq/live-common/lib/portfolio";
import { useCountervaluesState } from "@ledgerhq/live-common/lib/countervalues/react";
import { calculate } from "@ledgerhq/live-common/lib/countervalues/logic";
import type { State } from "~/renderer/reducers";
import { accountsSelector, activeAccountsSelector } from "~/renderer/reducers/accounts";
import { osDarkModeSelector } from "~/renderer/reducers/application";
import {
  getOrderAccounts,
  counterValueCurrencySelector,
  userThemeSelector,
} from "~/renderer/reducers/settings";

export function useDistribution() {
  const accounts = useSelector(accountsSelector);
  const calc = useCalculateCountervalueCallback();

  return useMemo(() => {
    return getAssetsDistribution(accounts, calc, {
      minShowFirst: 6,
      maxShowFirst: 6,
      showFirstThreshold: 0.95,
    });
  }, [accounts, calc]);
}

export function useCalculateCountervalueCallback() {
  const to = useSelector(counterValueCurrencySelector);
  const state = useCountervaluesState();

  return useCallback(
    (from: Currency, value: BigNumber): ?BigNumber => {
      const countervalue = calculate(state, {
        value: value.toNumber(),
        from,
        to,
        disableRounding: true,
      });
      return typeof countervalue !== "undefined" ? BigNumber(countervalue) : countervalue;
    },
    [to, state],
  );
}

export function useSortAccountsComparator() {
  const accounts = useSelector(getOrderAccounts);
  const calc = useCalculateCountervalueCallback();

  return sortAccountsComparatorFromOrder(accounts, calc);
}

export function useNestedSortAccounts() {
  const accounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();

  return useMemo(() => nestedSortAccounts(accounts, comparator), [accounts, comparator]);
}

export function useFlattenSortAccountsEnforceHideEmptyToken() {
  const accounts = useSelector(accountsSelector);
  const comparator = useSortAccountsComparator();
  return useMemo(
    () => flattenSortAccounts(accounts, comparator, { enforceHideEmptySubAccounts: true }),
    [accounts, comparator],
  );
}

export function useHaveUndelegatedAccountsSelector() {
  const accounts = useFlattenSortAccountsEnforceHideEmptyToken();
  return useMemo(
    () =>
      accounts.some(
        acc => acc.currency && acc.currency.family === "tezos" && !isAccountDelegating(acc),
      ),
    [accounts],
  );
}

export const delegatableAccountsSelector: OutputSelector<
  State,
  void,
  Account[],
> = createSelector(activeAccountsSelector, accounts =>
  accounts.filter(acc => acc.currency.family === "tezos" && !isAccountDelegating(acc)),
);

export function useRefreshAccountsOrdering() {
  const payload = useNestedSortAccounts();
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // workaround for not reflecting the latest payload when calling refresh right after updating accounts
  useEffect(() => {
    if (!isRefreshing) {
      return;
    }

    dispatch({
      type: "DB:SET_ACCOUNTS",
      payload,
    });
    setIsRefreshing(false);
  }, [isRefreshing, dispatch, payload]);

  return useCallback(() => {
    setIsRefreshing(true);
  }, []);
}

export function useRefreshAccountsOrderingEffect({
  onMount = false,
  onUnmount = false,
}: {
  onMount?: boolean,
  onUnmount?: boolean,
}) {
  const refreshAccountsOrdering = useRefreshAccountsOrdering();

  useEffect(() => {
    if (onMount) {
      refreshAccountsOrdering();
    }

    return () => {
      if (onUnmount) {
        refreshAccountsOrdering();
      }
    };
  }, [onMount, onUnmount, refreshAccountsOrdering]);
}

export const themeSelector: OutputSelector<State, void, string> = createSelector(
  osDarkModeSelector,
  userThemeSelector,
  (osDark, theme) => theme || (osDark ? "dark" : "light"),
);
