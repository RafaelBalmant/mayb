/**
 * Page frame shared by every screen: the content column and the fixed action bar.
 * `className` lets a screen add its own modifier (e.g. "app app-map"); `hideBar` removes the bar (start page).
 */
export function Layout({ className = "app", bar, hideBar = false, children }) {
  return (
    <>
      <div class={className} id="app">
        {children}
      </div>
      <div class="bar" id="bar" hidden={hideBar}>
        <div class="in" id="bar-in">
          {bar}
        </div>
      </div>
    </>
  );
}
