export const numberToWords = (n) => {
    if (n < 0) return "Minus " + numberToWords(-n);
    if (n === 0) return "Zero";
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (n < 20) return units[Math.floor(n)];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[Math.floor(n % 10)] : "");
    if (n < 1000) return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + numberToWords(n % 100) : "");
    if (n < 100000) return numberToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numberToWords(n % 1000) : "");
    if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numberToWords(n % 100000) : "");
    return n.toString();
};
