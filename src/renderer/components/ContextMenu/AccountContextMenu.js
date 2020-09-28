// @flow
import React, { useMemo } from "react";
import { useDispatch } from "react-redux";
import type { Account, AccountLike } from "@ledgerhq/live-common/lib/types/account";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import { openModal } from "~/renderer/actions/modals";
import IconReceive from "~/renderer/icons/Receive";
import IconSend from "~/renderer/icons/Send";
import IconStar from "~/renderer/icons/Star";
import IconBuy from "~/renderer/icons/Exchange";
import IconBan from "~/renderer/icons/Ban";
import IconAccountSettings from "~/renderer/icons/AccountSettings";
import ContextMenuItem from "./ContextMenuItem";
import { toggleStarAction } from "~/renderer/actions/accounts";
import { useRefreshAccountsOrdering } from "~/renderer/actions/general";
import { useHistory } from "react-router-dom";
import { isCurrencySupported } from "~/renderer/screens/exchange/config";

type Props = {
  account: AccountLike,
  parentAccount?: ?Account,
  leftClick?: boolean,
  children: any,
  withStar?: boolean,
};

export default function AccountContextMenu({
  leftClick,
  children,
  account,
  parentAccount,
  withStar,
}: Props) {
  const history = useHistory();
  const dispatch = useDispatch();
  const refreshAccountsOrdering = useRefreshAccountsOrdering();

  const menuItems = useMemo(() => {
    const currency = getAccountCurrency(account);

    const items = [
      {
        label: "accounts.contextMenu.send",
        Icon: IconSend,
        callback: () => dispatch(openModal("MODAL_SEND", { account, parentAccount })),
      },
      {
        label: "accounts.contextMenu.receive",
        Icon: IconReceive,
        callback: () => dispatch(openModal("MODAL_RECEIVE", { account, parentAccount })),
      },
    ];

    const availableOnExchange = isCurrencySupported(currency);

    if (availableOnExchange) {
      items.push({
        label: "accounts.contextMenu.buy",
        Icon: IconBuy,
        callback: () => history.push("/exchange"),
      });
    }

    if (withStar) {
      items.push({
        label: "accounts.contextMenu.star",
        Icon: IconStar,
        callback: () => {
          dispatch(
            toggleStarAction(account.id, account.type !== "Account" ? account.parentId : undefined),
          );
          refreshAccountsOrdering();
        },
      });
    }

    if (account.type === "Account") {
      items.push({
        label: "accounts.contextMenu.edit",
        Icon: IconAccountSettings,
        callback: () => dispatch(openModal("MODAL_SETTINGS_ACCOUNT", { account })),
      });
    }

    if (account.type === "TokenAccount") {
      items.push({
        label: "accounts.contextMenu.hideToken",
        Icon: IconBan,
        callback: () => dispatch(openModal("MODAL_BLACKLIST_TOKEN", { token: account.token })),
      });
    }

    return items;
  }, [account, history, parentAccount, withStar, dispatch, refreshAccountsOrdering]);

  const currency = getAccountCurrency(account);

  return (
    <ContextMenuItem
      event={account.type === "Account" ? "Account right click" : "Token right click"}
      eventProperties={{ currencyName: currency.name }}
      leftClick={leftClick}
      items={menuItems}
    >
      {children}
    </ContextMenuItem>
  );
}
