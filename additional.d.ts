import 'little-state-machine';

declare module 'little-state-machine' {
  interface GlobalState {
    step: 'Email' | 'Token' | 'Password';
    email: string;
    token: string;
    password: string;
  }
}

// React 19 removed the global JSX namespace; V1 components annotate with JSX.Element.
import type * as React from 'react';
declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementType = React.JSX.ElementType;
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
  }
}
