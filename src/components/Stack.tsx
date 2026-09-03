import * as React from 'react';
import MuiStack from '@mui/material/Stack';
import type { StackProps as MuiStackProps } from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';

type Responsive<T> = T | Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', T>>;

/**
 * MUI v9 removed the system shorthand props from components. This thin wrapper
 * restores the flexbox shorthands the application uses and forwards them into
 * `sx`, so layout code stays readable.
 */
export interface StackProps extends Omit<MuiStackProps, 'gap'> {
  gap?: Responsive<number | string>;
  justifyContent?: Responsive<string>;
  alignItems?: Responsive<string>;
  alignSelf?: Responsive<string>;
  flexWrap?: Responsive<string>;
  flex?: Responsive<number | string>;
  minWidth?: Responsive<number | string>;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap, justifyContent, alignItems, alignSelf, flexWrap, flex, minWidth, sx, ...rest }, ref,
) {
  const layout: SxProps<Theme> = {
    ...(gap != null ? { gap } : {}),
    ...(justifyContent != null ? { justifyContent } : {}),
    ...(alignItems != null ? { alignItems } : {}),
    ...(alignSelf != null ? { alignSelf } : {}),
    ...(flexWrap != null ? { flexWrap } : {}),
    ...(flex != null ? { flex } : {}),
    ...(minWidth != null ? { minWidth } : {}),
  } as SxProps<Theme>;
  const merged = Array.isArray(sx) ? [layout, ...sx] : sx ? [layout, sx] : layout;
  return <MuiStack ref={ref} sx={merged} {...rest} />;
});

export default Stack;
