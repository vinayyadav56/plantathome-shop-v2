import { forwardRef, useEffect, useId, useState } from 'react';
import ReactSelect, { Props } from 'react-select';
import { selectStyles } from './select.styles';

type Ref = any;

const Select = forwardRef<Ref, Props>((props, ref) => {
  // react-select emits SSR markup (auto-incremented element ids + an
  // `aria-activedescendant` attribute on its input) that differs from the
  // client's first render, producing hydration warnings ("Prop did not match
  // … react-select-N-live-region" / "Extra attributes from the server:
  // aria-activedescendant"). These controls are purely interactive (no SEO
  // value), so we render a matched-size placeholder on the server + the
  // client's first paint — identical on both, so hydration is clean — then
  // swap in the real control after mount.
  const generatedId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    const isMinimal = (props as any).isMinimal;
    const width = (props as any).width;
    return (
      <div
        aria-hidden="true"
        style={{ minHeight: isMinimal ? 0 : 50, width }}
      />
    );
  }

  return (
    <ReactSelect
      ref={ref}
      instanceId={props.instanceId ?? generatedId}
      styles={selectStyles}
      {...props}
    />
  );
});

Select.displayName = 'Select';
export default Select;
