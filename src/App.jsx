import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ============ LUNAR CALENDAR UTILITIES ============
// Thuật toán chuyển đổi âm-dương lịch theo Hồ Ngọc Đức

const PI = Math.PI;

function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}

function getNewMoonDay(k, timeZone) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltat;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn, timeZone) {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - PI * 2 * Math.floor(L / (PI * 2));
  return Math.floor((L / PI) * 6);
}

function getLunarMonth11(yy, timeZone) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

// ============ CAN CHI UTILITIES ============
const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

function getCanChiYear(year) {
  const can = CAN[(year + 6) % 10];
  const chi = CHI[(year + 8) % 12];
  return `${can} ${chi}`;
}

// ============ HOLIDAYS UTILITIES ============
const SOLAR_HOLIDAYS = {
  '1-1': 'Tết Dương lịch',
  '14-2': 'Valentine',
  '8-3': 'Quốc tế Phụ nữ',
  '30-4': 'Giải phóng miền Nam',
  '1-5': 'Quốc tế Lao động',
  '1-6': 'Quốc tế Thiếu nhi',
  '2-9': 'Quốc khánh',
  '20-10': 'Ngày Phụ nữ Việt Nam',
  '20-11': 'Ngày Nhà giáo Việt Nam',
  '24-12': 'Giáng sinh',
  '25-12': 'Giáng sinh'
};

const LUNAR_HOLIDAYS = {
  '1-1': 'Tết Nguyên Đán',
  '15-1': 'Tết Nguyên Tiêu',
  '10-3': 'Giỗ Tổ Hùng Vương',
  '15-4': 'Phật Đản',
  '5-5': 'Tết Đoan Ngọ',
  '15-7': 'Vu Lan',
  '15-8': 'Tết Trung Thu',
  '23-12': 'Ông Táo chầu trời'
};

function getHoliday(day, month, lunarDay, lunarMonth) {
  const solarKey = `${day}-${month}`;
  const lunarKey = `${lunarDay}-${lunarMonth}`;
  return SOLAR_HOLIDAYS[solarKey] || LUNAR_HOLIDAYS[lunarKey] || null;
}

// ============ COMPONENTS ============

const DayCell = React.memo(({ day, month, year, isToday, isWeekend, isSunday, isSelected, onToggle }) => {
  const [lunarDay, lunarMonth] = convertSolar2Lunar(day, month, year);
  const holiday = getHoliday(day, month, lunarDay, lunarMonth);

  return (
    <div
      className={`day-cell ${isToday ? 'today' : ''} ${isSunday ? 'sunday' : isWeekend ? 'saturday' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(day, month, year)}
    >
      <div className="solar-day">{day}</div>
      <div className="lunar-day">{lunarDay}/{lunarMonth}</div>
      {holiday && <div className="holiday-dot" title={holiday}></div>}
    </div>
  );
});

const MonthCalendar = React.memo(({ month, year, selectedDates, onToggleDate }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayRaw = new Date(year, month - 1, 1).getDay();
  // Convert Sunday (0) to 7, and shift Monday to 1
  const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="day-cell empty"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const isToday = isCurrentMonth && today.getDate() === day;
    const isSunday = dayOfWeek === 0;
    const isWeekend = dayOfWeek === 6;
    const dateKey = `${year}-${month}-${day}`;
    const isSelected = selectedDates.has(dateKey);

    days.push(
      <DayCell
        key={day}
        day={day}
        month={month}
        year={year}
        isToday={isToday}
        isWeekend={isWeekend}
        isSunday={isSunday}
        isSelected={isSelected}
        onToggle={onToggleDate}
      />
    );
  }

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  return (
    <div className="month-calendar">
      <div className="month-header">{monthNames[month - 1]} {year}</div>
      <div className="weekday-header">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>
      <div className="days-grid">{days}</div>
    </div>
  );
});

const AdBanner = ({ type }) => {
  return null;
  if (type === 'top' || type === 'bottom') {
    return (
      <div className="ad-banner desktop-ad">
        <div className="ad-placeholder">Google AdSense 728x90</div>
      </div>
    );
  }
  if (type === 'mobile-sticky') {
    return (
      <div className="ad-banner mobile-sticky-ad">
        <div className="ad-placeholder">AdSense 320x50</div>
      </div>
    );
  }
  if (type === 'in-feed') {
    return (
      <div className="ad-banner in-feed-ad">
        <div className="ad-placeholder">In-feed Ad</div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([new Date().getFullYear()]);
  const [selectedDates, setSelectedDates] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedDates');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      return new Set();
    }
  });
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearInput, setYearInput] = useState('');
  const observerTarget = useRef(null);
  const yearRefs = useRef({});
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setYears(prev => [...prev, prev[prev.length - 1] + 1]);
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  const scrollToYear = (year) => {
    setTimeout(() => {
      if (yearRefs.current[year]) {
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const elementPosition = yearRefs.current[year].getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };
  
  const handlePrevYear = () => {
    const newYear = currentYear - 1;
    setCurrentYear(newYear);
    if (!years.includes(newYear)) {
      setYears(prev => [newYear, ...prev].sort((a, b) => a - b));
    }
    scrollToYear(newYear);
  };
  
  const handleNextYear = () => {
    const newYear = currentYear + 1;
    setCurrentYear(newYear);
    if (!years.includes(newYear)) {
      setYears(prev => [...prev, newYear].sort((a, b) => a - b));
    }
    scrollToYear(newYear);
  };

  const toggleDateSelection = useCallback((day, month, year) => {
    const dateKey = `${year}-${month}-${day}`;
    setSelectedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }

      // Save to localStorage
      try {
        localStorage.setItem('selectedDates', JSON.stringify([...newSet]));
      } catch (error) {
        console.error('Failed to save selected dates:', error);
      }

      return newSet;
    });
  }, []);

  const handleYearPickerSubmit = useCallback((year) => {
    const yearNum = parseInt(year);
    if (yearNum >= 1900 && yearNum <= 2100) {
      setCurrentYear(yearNum);
      if (!years.includes(yearNum)) {
        setYears(prev => [...prev, yearNum].sort((a, b) => a - b));
      }
      scrollToYear(yearNum);
      setShowYearPicker(false);
      setYearInput('');
    }
  }, [years]);

  const generateYearRange = useCallback(() => {
    // If search input has 3 or more characters, filter years based on the search
    if (yearInput && yearInput.length >= 3) {
      const searchStr = yearInput.toString();
      const yearsList = [];
      for (let y = 1900; y <= 2100; y++) {
        if (y.toString().includes(searchStr)) {
          yearsList.push(y);
        }
      }
      return yearsList;
    }

    // Default: show 5 years before and after current year
    const currentYearNum = currentYear;
    const startYear = currentYearNum - 5;
    const endYear = currentYearNum + 5;
    const yearsList = [];
    for (let y = startYear; y <= endYear; y++) {
      yearsList.push(y);
    }
    return yearsList;
  }, [yearInput, currentYear]);
  
  return (
    <div className="app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
        }

        #root {
          width: 100%;
          max-width: 1400px;
          display: flex;
          flex-direction: column;
        }

        .app {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          text-align: center;
          color: white;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 10px 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .header h1 {
          font-size: 1.5rem;
          margin-bottom: 5px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .year-selector {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 0;
        }
        
        .year-btn {
          background: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          font-size: 14px;
          color: #667eea;
          font-weight: bold;
        }
        
        .year-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .year-display {
          background: rgba(255,255,255,0.2);
          padding: 8px 24px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s;
        }

        .year-display:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.05);
        }

        .year-text {
          font-size: 1.3rem;
          font-weight: bold;
          color: white;
        }

        .can-chi {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.9);
          margin-top: 2px;
        }
        
        .year-picker-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .year-picker-modal {
          background: white;
          border-radius: 15px;
          padding: 20px;
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .year-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e9ecef;
        }

        .year-picker-title {
          font-size: 1.2rem;
          font-weight: bold;
          color: #667eea;
        }

        .year-picker-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6c757d;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }

        .year-picker-close:hover {
          background: #f8f9fa;
        }

        .year-input-group {
          margin-bottom: 15px;
        }

        .year-input-label {
          display: block;
          margin-bottom: 5px;
          font-size: 0.9rem;
          color: #495057;
          font-weight: 500;
        }

        .year-input-wrapper {
          display: flex;
          gap: 10px;
        }

        .year-input {
          flex: 1;
          padding: 10px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .year-input:focus {
          border-color: #667eea;
        }

        .year-input-submit {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: transform 0.2s;
        }

        .year-input-submit:hover {
          transform: scale(1.05);
        }

        .year-list-container {
          overflow-y: auto;
          max-height: 400px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 10px;
        }

        .year-list {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .year-list-item {
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          background: white;
          transition: all 0.2s;
          font-weight: 500;
        }

        .year-list-item:hover {
          background: #f8f9fa;
          border-color: #667eea;
        }

        .year-list-item.current {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
        }

        .ad-banner {
          margin: 20px auto;
          text-align: center;
        }
        
        .ad-placeholder {
          background: rgba(255,255,255,0.1);
          border: 2px dashed rgba(255,255,255,0.3);
          padding: 20px;
          border-radius: 8px;
          color: white;
          font-size: 14px;
        }
        
        .desktop-ad .ad-placeholder {
          width: 728px;
          height: 90px;
          max-width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mobile-sticky-ad {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: white;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        }
        
        .mobile-sticky-ad .ad-placeholder {
          width: 320px;
          height: 50px;
          margin: 0 auto;
          background: #f0f0f0;
          border-color: #ddd;
          color: #666;
        }
        
        .in-feed-ad {
          display: none;
        }
        
        .year-section {
          margin-bottom: 60px;
          scroll-margin-top: 120px;
        }
        
        .year-title {
          text-align: center;
          color: white;
          font-size: 2rem;
          margin: 40px 0 30px;
          padding: 15px;
          background: rgba(255,255,255,0.1);
          border-radius: 15px;
          backdrop-filter: blur(10px);
        }
        
        .months-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .month-calendar {
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: transform 0.3s;
        }
        
        .month-calendar:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        
        .month-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          text-align: center;
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .weekday-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 2px solid #e9ecef;
        }
        
        .weekday {
          padding: 10px;
          text-align: center;
          font-weight: bold;
          font-size: 0.85rem;
          color: #495057;
        }
        
        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e9ecef;
        }
        
        .day-cell {
          background: white;
          padding: 8px 4px;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background 0.2s;
          border: 2px solid transparent;
        }
        
        .day-cell:hover:not(.empty) {
          background: #f8f9fa;
          cursor: pointer;
        }
        
        .day-cell.empty {
          background: #f8f9fa;
        }
        
        .solar-day {
          font-size: 1.1rem;
          font-weight: bold;
          color: #212529;
        }
        
        .lunar-day {
          font-size: 0.7rem;
          color: #6c757d;
          margin-top: 2px;
        }
        
        .day-cell.sunday .solar-day {
          color: #dc3545;
        }
        
        .day-cell.saturday .solar-day {
          color: #0d6efd;
        }
        
        .day-cell.today {
          background: #fff3cd;
          border: 2px solid #ffc107;
        }

        .day-cell.selected {
          background: #d1e7dd;
          border: 2px solid #198754;
        }

        .day-cell.selected.today {
          background: linear-gradient(135deg, #fff3cd 0%, #d1e7dd 100%);
          border: 2px solid #198754;
          box-shadow: 0 0 0 2px #ffc107 inset;
        }
        
        .holiday-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          background: #dc3545;
          border-radius: 50%;
        }
        
        .observer-target {
          height: 20px;
          margin: 40px 0;
        }
        
        @media (max-width: 1024px) {
          .months-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .header h1 {
            font-size: 1.3rem;
          }
        }

        @media (max-width: 768px) {
          .app {
            padding: 5px;
            padding-bottom: 60px;
          }

          .months-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .header {
            padding: 6px 0;
            margin-bottom: 10px;
          }

          .header h1 {
            font-size: 1rem;
            margin-bottom: 3px;
          }

          .year-selector {
            gap: 10px;
          }

          .year-text {
            font-size: 0.95rem;
          }

          .can-chi {
            font-size: 0.7rem;
            margin-top: 1px;
          }

          .year-display {
            padding: 5px 15px;
          }

          .year-btn {
            width: 26px;
            height: 26px;
            font-size: 11px;
          }

          .year-section {
            margin-bottom: 30px;
            scroll-margin-top: 70px;
          }

          .year-title {
            font-size: 1.3rem;
            margin: 20px 0 15px;
            padding: 10px;
          }

          .month-calendar {
            border-radius: 10px;
          }

          .month-header {
            padding: 8px;
            font-size: 0.9rem;
          }

          .weekday-header {
            border-bottom: 1px solid #e9ecef;
          }

          .weekday {
            padding: 5px;
            font-size: 0.7rem;
          }

          .days-grid {
            gap: 0.5px;
          }

          .desktop-ad {
            display: none;
          }

          .mobile-sticky-ad, .in-feed-ad {
            display: block;
          }

          .day-cell {
            min-height: 42px;
            padding: 4px 2px;
          }

          .solar-day {
            font-size: 0.85rem;
          }

          .lunar-day {
            font-size: 0.6rem;
            margin-top: 1px;
          }

          .holiday-dot {
            width: 4px;
            height: 4px;
            top: 3px;
            right: 3px;
          }

          .year-section:nth-child(3n) .in-feed-ad {
            display: block;
            margin: 15px 0;
          }

          .ad-banner {
            margin: 10px auto;
          }
        }
      `}</style>
      
      <div className="header">
        <h1>📅 Lịch Vạn Niên Việt Nam</h1>
        <div className="year-selector">
          <button className="year-btn" onClick={handlePrevYear}>
            ◀
          </button>
          <div className="year-display" onClick={() => setShowYearPicker(true)}>
            <div className="year-text">{currentYear}</div>
            <div className="can-chi">{getCanChiYear(currentYear)}</div>
          </div>
          <button className="year-btn" onClick={handleNextYear}>
            ▶
          </button>
        </div>
      </div>

      {showYearPicker && (
        <div className="year-picker-overlay" onClick={() => setShowYearPicker(false)}>
          <div className="year-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="year-picker-header">
              <div className="year-picker-title">Chọn năm</div>
              <button className="year-picker-close" onClick={() => setShowYearPicker(false)}>
                ×
              </button>
            </div>

            <div className="year-input-group">
              <label className="year-input-label">Tìm kiếm năm:</label>
              <div className="year-input-wrapper">
                <input
                  type="number"
                  className="year-input"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && yearInput) {
                      handleYearPickerSubmit(yearInput);
                    }
                  }}
                  placeholder="Nhập năm..."
                />
                <button
                  className="year-input-submit"
                  onClick={() => yearInput && handleYearPickerSubmit(yearInput)}
                >
                  Đi
                </button>
              </div>
            </div>

            <div className="year-list-container">
              <div className="year-list">
                {generateYearRange().map((year) => (
                  <div
                    key={year}
                    className={`year-list-item ${year === currentYear ? 'current' : ''}`}
                    onClick={() => handleYearPickerSubmit(year)}
                  >
                    {year}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AdBanner type="top" />
      
      {years.map((year, yearIndex) => (
        <div 
          key={year} 
          className="year-section"
          ref={el => yearRefs.current[year] = el}
        >
          {year !== currentYear && (
            <h2 className="year-title">
              Năm {year} - {getCanChiYear(year)}
            </h2>
          )}
          
          <div className="months-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month, index) => (
              <React.Fragment key={`${year}-${month}`}>
                <MonthCalendar
                  month={month}
                  year={year}
                  selectedDates={selectedDates}
                  onToggleDate={toggleDateSelection}
                />
                {index === 5 && <AdBanner type="in-feed" />}
              </React.Fragment>
            ))}
          </div>
          
          {yearIndex === years.length - 1 && (
            <div ref={observerTarget} className="observer-target"></div>
          )}
        </div>
      ))}
      
      <AdBanner type="bottom" />
      <AdBanner type="mobile-sticky" />
    </div>
  );
}