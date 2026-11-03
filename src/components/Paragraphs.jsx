/** One <p> per text. */
export const Paragraphs = ({ items, className }) =>
  items.map((text) => (
    <p key={text} className={className}>
      {text}
    </p>
  ));
