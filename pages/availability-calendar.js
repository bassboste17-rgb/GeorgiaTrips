class AvailabilityCalendar {
    constructor(container, options = {}) {
        this.container = container;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.onDateSelect = options.onDateSelect || (() => {});
        this.availableDates = options.availableDates || [];
        this.bookedDates = options.bookedDates || [];
        this.itemType = options.itemType || 'cars';
        
        this.monthNames = [
            'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
            'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
        ];
        
        this.seasons = {
            spring: { name: 'გაზაფხული', icon: '🌸', months: [2, 3, 4] },
            summer: { name: 'ზაფხული', icon: '☀️', months: [5, 6, 7] },
            autumn: { name: 'შემოდგომა', icon: '🍂', months: [8, 9, 10] },
            winter: { name: 'ზამთარი', icon: '❄️', months: [11, 0, 1] }
        };
        
        this.init();
    }
    
    init() {
        this.render();
        this.addLegend();
    }
    
    getSeason(month) {
        for (let season in this.seasons) {
            if (this.seasons[season].months.includes(month)) {
                return { key: season, ...this.seasons[season] };
            }
        }
    }
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const season = this.getSeason(month);
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        
        const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const lastDayDate = lastDay.getDate();
        const prevLastDayDate = prevLastDay.getDate();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let daysHTML = '';
        
        // Previous month days
        for (let i = firstDayIndex; i > 0; i--) {
            const day = prevLastDayDate - i + 1;
            daysHTML += `<div class="day other-month">${day}</div>`;
        }
        
        // Current month days
        for (let i = 1; i <= lastDayDate; i++) {
            const currentDate = new Date(year, month, i);
            currentDate.setHours(0, 0, 0, 0);
            const dateString = currentDate.toISOString().split('T')[0];
            
            const isToday = currentDate.getTime() === today.getTime();
            const isPast = currentDate < today;
            
            let classes = 'day';
            if (isToday) classes += ' today';
            
            if (this.itemType === 'tours') {
                // For tours: only availableDates are selectable
                if (this.availableDates.length > 0) {
                    const isAvailable = this.availableDates.includes(dateString);
                    if (!isAvailable || isPast) {
                        classes += ' disabled';
                    } else {
                        classes += ' available';
                    }
                } else { // If no specific available dates, assume all past dates are disabled
                    if (isPast) {
                        classes += ' disabled';
                    } else {
                        classes += ' available';
                    }
                }
            } else {
                // For cars: all dates except bookedDates are available
                const isBooked = this.bookedDates.includes(dateString);
                if (isBooked || isPast) {
                    classes += ' disabled';
                    if (isBooked && !isPast) {
                        classes += ' booked';
                    }
                } else {
                    classes += ' available';
                }
            }
            
            if (this.selectedDate === dateString) {
                classes += ' selected';
            }
            
            daysHTML += `<div class="${classes}" data-date="${dateString}">${i}</div>`;
        }
        
        // Next month days
        const remainingDays = 42 - (firstDayIndex + lastDayDate);
        for (let i = 1; i <= remainingDays; i++) {
            daysHTML += `<div class="day other-month">${i}</div>`;
        }
        
        this.container.innerHTML = `
            <div class="seasonal-calendar">
                <h3><i class="fas fa-calendar-alt"></i> ხელმისაწვდომობის კალენდარი</h3>
                <div class="calendar-container ${season.key}">
                    <div class="calendar-header">
                        <div class="nav-buttons">
                            <button class="prev-month calendar-nav">◀</button>
                        </div>
                        <div style="text-align: center;">
                            <div class="season-indicator">${season.icon}</div>
                            <h2>${this.monthNames[month]} ${year}</h2>
                        </div>
                        <div class="nav-buttons">
                            <button class="next-month calendar-nav">▶</button>
                        </div>
                    </div>
                    
                    <div class="weekdays">
                        <div class="weekday">ორშ</div>
                        <div class="weekday">სამ</div>
                        <div class="weekday">ოთხ</div>
                        <div class="weekday">ხუთ</div>
                        <div class="weekday">პარ</div>
                        <div class="weekday">შაბ</div>
                        <div class="weekday">კვი</div>
                    </div>
                    
                    <div class="days" id="calendarDays">
                        ${daysHTML}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.container.querySelector('.prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        this.container.querySelector('.next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
        
        // Add click listeners to days
        this.container.querySelectorAll('.day:not(.disabled):not(.other-month)').forEach(day => {
            day.addEventListener('click', () => {
                this.selectDate(day.dataset.date);
            });
        });
    }
    
    addLegend() {
        const legendHTML = `
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-color legend-available"></div>
                    <span>ხელმისაწვდომი</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-booked"></div>
                    <span>დაკავებული</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-selected"></div>
                    <span>არჩეული</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color legend-today"></div>
                    <span>დღეს</span>
                </div>
            </div>
        `;
        
        this.container.querySelector('.seasonal-calendar').insertAdjacentHTML('beforeend', legendHTML);
    }
    
    selectDate(dateString) {
        // Remove previous selection
        this.container.querySelectorAll('.day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selection to clicked day
        const selectedDay = this.container.querySelector(`.day[data-date="${dateString}"]`);
        if (selectedDay) {
            selectedDay.classList.add('selected');
            this.selectedDate = dateString;
            
            // Call callback
            this.onDateSelect(this.selectedDate);
        }
    }
    
    getSelectedDate() {
        return this.selectedDate;
    }
    
    setAvailableDates(dates) {
        this.availableDates = dates;
        this.render();
    }
    
    setBookedDates(dates) {
        this.bookedDates = dates;
        this.render();
    }
    
    setItemType(type) {
        this.itemType = type;
        this.render();
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const calendarContainer = document.querySelector('.calendar-container');
    
    // Example data - replace with your actual data
    const availableDates = [
        '2025-10-15', '2025-10-16', '2025-10-17', '2025-10-20', 
        '2025-10-21', '2025-10-22', '2025-10-25', '2025-10-26'
    ];
    
    const bookedDates = [
        '2025-10-10', '2025-10-11', '2025-10-18', '2025-10-19',
        '2025-10-23', '2025-10-24'
    ];
    
    const calendar = new AvailabilityCalendar(calendarContainer, {
        availableDates: availableDates,
        bookedDates: bookedDates,
        itemType: 'tours', // or 'cars'
        onDateSelect: (date) => {
            console.log('Selected date:', date);
            // Handle date selection here
            alert(`არჩეული თარიღი: ${date}`);
        }
    });
    
    // Make calendar globally accessible
    window.availabilityCalendar = calendar;
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvailabilityCalendar;
}