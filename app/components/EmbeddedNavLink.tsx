import { Link, useLocation } from "react-router";
import type { CSSProperties, ReactNode } from "react";

export function EmbeddedNavLink({
  to,
  children,
  className,
  style,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const location = useLocation();

  return (
    <Link
      to={{
        pathname: to,
        search: location.search,
      }}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
}