export class DateTime extends Date {
  private date: Date;

  constructor(date: Date | string) {
    super(date);
    this.date = new Date(date);
  }

  isSameDay(other: Date): boolean {
    return (
      this.date.getFullYear() === other.getFullYear() &&
      this.date.getMonth() === other.getMonth() &&
      this.date.getDate() === other.getDate()
    );
  }

  get isMonday(): boolean {
    return this.date.getDay() === 1;
  }
}
