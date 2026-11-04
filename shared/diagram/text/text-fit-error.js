// Content too long for the room a layout gives it: a word wider than its line, or a label wider than its shape. Stable
// generation sends it back to the model as its repair, since shorter text fixes it; any other render error is a bug.
export class TextFitError extends RangeError {
  constructor(message) {
    super(message);
    this.name = "TextFitError";
  }
}
