export const readingTime = (text: string, wpm = 275) => {
  const words = text.trim().split(/\s+/).length;
  const timeInMinutes = Math.ceil(words / wpm); // Rounding up
  return timeInMinutes;
};
