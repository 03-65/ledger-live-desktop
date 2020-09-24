// @flow

import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import type { Currency, Unit } from "@ledgerhq/live-common/lib/types/currencies";
import { useCalculate } from "@ledgerhq/live-common/lib/countervalues/react";
import { getCurrencyColor } from "~/renderer/getCurrencyColor";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { colors } from "~/renderer/styles/theme";
import useTheme from "~/renderer/hooks/useTheme";
import Box from "~/renderer/components/Box";
import CurrencyUnitValue from "~/renderer/components/CurrencyUnitValue";
import IconActivity from "~/renderer/icons/Activity";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

type Props = {
  unit?: Unit,
  from: Currency,
  to?: Currency,
  withActivityCurrencyColor?: boolean,
  withActivityColor?: string,
  withEquality?: boolean,
  date?: Date,
  color?: string,
  fontSize?: number,
  iconSize?: number,
  placeholder?: React$Node,
};

export default function Price({
  from,
  to,
  unit,
  date,
  withActivityCurrencyColor,
  withActivityColor,
  withEquality,
  placeholder,
  color,
  fontSize,
  iconSize,
}: Props) {
  const effectiveUnit = unit || from.units[0];
  const value = BigNumber(10 ** effectiveUnit.magnitude);
  const rawCounterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterValueCurrency = to || rawCounterValueCurrency;
  const rawCounterValue = useCalculate({
    from,
    to: counterValueCurrency,
    value: value.toNumber(),
    disableRounding: true,
  });
  const counterValue =
    typeof rawCounterValue !== "undefined" ? BigNumber(rawCounterValue) : rawCounterValue;

  const bgColor = useTheme("colors.palette.background.paper");
  if (!counterValue || counterValue.isZero()) return placeholder || null;

  const activityColor = withActivityColor
    ? colors[withActivityColor]
    : !withActivityCurrencyColor
    ? color
      ? colors[color]
      : undefined
    : getCurrencyColor(from, bgColor);

  const subMagnitude = counterValue.lt(1) ? 1 : 0;

  return (
    <PriceWrapper color={color} fontSize={fontSize}>
      <IconActivity size={iconSize || 12} style={{ color: activityColor, marginRight: 4 }} />
      {!withEquality ? null : (
        <>
          <CurrencyUnitValue value={value} unit={effectiveUnit} showCode />
          {" = "}
        </>
      )}
      <CurrencyUnitValue
        unit={counterValueCurrency.units[0]}
        value={counterValue}
        disableRounding={!!subMagnitude}
        subMagnitude={subMagnitude}
        showCode
      />
    </PriceWrapper>
  );
}

const PriceWrapper: ThemedComponent<{}> = styled(Box).attrs(() => ({
  ff: "Inter",
  horizontal: true,
}))`
  line-height: 1.2;
  white-space: pre;
  align-items: baseline;
`;
