import { addDays, addWeeks, format, getDay, setHours, setMinutes, startOfToday, addYears, isBefore } from 'date-fns';

export function getNextDayOfWeek(dayIndex: number, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const today = new Date(); // Utiliser la date et l'heure actuelles au lieu de startOfToday
  let date = setMinutes(setHours(today, hours), minutes);
  
  const currentDayIndex = getDay(today);
  
  if (currentDayIndex === dayIndex) {
    // Si c'est le même jour, vérifier si l'heure est déjà passée
    if (date <= today) {
      // Si l'heure est passée, passer à la semaine suivante
      date = addWeeks(date, 1);
    }
  } else {
    // Calculer le nombre de jours jusqu'au prochain jour souhaité
    const daysUntilNext = (dayIndex - currentDayIndex + 7) % 7;
    date = addDays(date, daysUntilNext);
  }
  
  return date;
}

export function generateRecurringDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = startDate;

  while (isBefore(currentDate, endDate)) {
    dates.push(currentDate);
    currentDate = addWeeks(currentDate, 1);
  }

  return dates;
}