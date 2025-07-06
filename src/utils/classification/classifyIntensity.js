export default function classifyIntensity(intensity) {
  switch (intensity) {
    case 10:
      return "1";
    case 20:
      return "2";
    case 30:
      return "3";
    case 40:
      return "4";
    case 45:
      return "5-";
    case 50:
      return "5+";
    case 55:
      return "6-";
    case 60:
      return "6+";
    case 70:
      return "7";
    default:
      return "--";
  }
}
