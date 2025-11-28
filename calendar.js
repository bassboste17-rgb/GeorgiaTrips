// Custom Calendar Component for Booking Platform
// Dark theme calendar with Georgian language support

class CustomCalendar {
  constructor(inputElement, options = {}) {
    this.input = inputElement
    this.options = {
      minDate: options.minDate || new Date(),
      maxDate: options.maxDate || null,
      onSelect: options.onSelect || (() => {}),
      disabledDates: options.disabledDates || [],
      ...options,
    }

    this.currentDate = new Date()
    this.selectedDate = null
    this.isOpen = false

    this.monthNames = [
      "იანვარი",
      "თებერვალი",
      "მარტი",
      "აპრილი",
      "მაისი",
      "ივნისი",
      "ივლისი",
      "აგვისტო",
      "სექტემბერი",
      "ოქტომბერი",
      "ნოემბერი",
      "დეკემბერი",
    ]

    this.dayNames = ["კვ", "ორ", "სა", "ოთ", "ხუ", "პა", "შა"]

    this.init()
  }

  init() {
    // Create calendar container
    this.calendar = document.createElement("div")
    this.calendar.className = "custom-calendar"
    this.calendar.style.display = "none"

    // Position calendar below input
    this.input.parentNode.style.position = "relative"
    this.input.parentNode.appendChild(this.calendar)

    // Add click event to input
    this.input.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggle()
    })

    // Close calendar when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.calendar.contains(e.target) && e.target !== this.input) {
        this.close()
      }
    })

    // Prevent input from opening native date picker
    this.input.setAttribute("readonly", "true")

    this.render()
  }

  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    this.isOpen = true
    this.calendar.style.display = "block"
    this.render()
  }

  close() {
    this.isOpen = false
    this.calendar.style.display = "none"
  }

  render() {
    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()

    this.calendar.innerHTML = `
      <div class="calendar-header">
        <button type="button" class="calendar-nav" data-action="prev-month">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="calendar-title">
          ${this.monthNames[month]} ${year}
        </div>
        <button type="button" class="calendar-nav" data-action="next-month">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div class="calendar-weekdays">
        ${this.dayNames.map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
      </div>
      <div class="calendar-days">
        ${this.renderDays()}
      </div>
    `

    // Add event listeners
    this.calendar.querySelector('[data-action="prev-month"]').addEventListener("click", (e) => {
      e.stopPropagation()
      this.prevMonth()
    })

    this.calendar.querySelector('[data-action="next-month"]').addEventListener("click", (e) => {
      e.stopPropagation()
      this.nextMonth()
    })

    this.calendar.querySelectorAll(".calendar-day:not(.disabled)").forEach((day) => {
      day.addEventListener("click", (e) => {
        e.stopPropagation()
        const dateStr = day.dataset.date
        this.selectDate(new Date(dateStr))
      })
    })
  }

  renderDays() {
    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const prevLastDay = new Date(year, month, 0)

    const firstDayIndex = firstDay.getDay()
    const lastDayDate = lastDay.getDate()
    const prevLastDayDate = prevLastDay.getDate()

    let days = ""

    // Previous month days
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1
    for (let i = startDay; i > 0; i--) {
      days += `<div class="calendar-day other-month">${prevLastDayDate - i + 1}</div>`
    }

    // Current month days
    for (let day = 1; day <= lastDayDate; day++) {
      const date = new Date(year, month, day)
      const dateStr = this.formatDate(date)
      const isDisabled = this.isDateDisabled(date)
      const isSelected = this.selectedDate && this.formatDate(this.selectedDate) === dateStr
      const isToday = this.formatDate(new Date()) === dateStr

      let classes = "calendar-day"
      if (isDisabled) classes += " disabled"
      if (isSelected) classes += " selected"
      if (isToday) classes += " today"

      days += `<div class="${classes}" data-date="${dateStr}">${day}</div>`
    }

    // Next month days
    const remainingDays = 42 - (startDay + lastDayDate)
    for (let day = 1; day <= remainingDays; day++) {
      days += `<div class="calendar-day other-month">${day}</div>`
    }

    return days
  }

  isDateDisabled(date) {
    // Check min date
    if (this.options.minDate) {
      const minDate = new Date(this.options.minDate)
      minDate.setHours(0, 0, 0, 0)
      if (date < minDate) return true
    }

    // Check max date
    if (this.options.maxDate) {
      const maxDate = new Date(this.options.maxDate)
      maxDate.setHours(0, 0, 0, 0)
      if (date > maxDate) return true
    }

    // Check disabled dates
    const dateStr = this.formatDate(date)
    if (this.options.disabledDates.includes(dateStr)) return true

    return false
  }

  selectDate(date) {
    this.selectedDate = date
    this.input.value = this.formatDate(date)

    // Trigger change event
    const event = new Event("change", { bubbles: true })
    this.input.dispatchEvent(event)

    this.options.onSelect(date)
    this.close()
  }

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1)
    this.render()
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1)
    this.render()
  }

  setMinDate(date) {
    this.options.minDate = date
    this.render()
  }

  setMaxDate(date) {
    this.options.maxDate = date
    this.render()
  }

  destroy() {
    this.calendar.remove()
    this.input.removeAttribute("readonly")
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = CustomCalendar
}
