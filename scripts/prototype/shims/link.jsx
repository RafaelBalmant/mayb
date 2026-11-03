// Stands in for next/link in the prototype page: a plain link to the page's #name.
import { hashOfPath, useRouter } from "./navigation.js";

export default function Link({ href, children, onClick, ...rest }) {
  const router = useRouter();
  const follow = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    router.push(href);
  };
  return (
    <a href={`#${hashOfPath(href)}`} onClick={follow} {...rest}>
      {children}
    </a>
  );
}
