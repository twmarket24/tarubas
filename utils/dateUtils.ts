const CURRENT_YEAR = new Date().getFullYear();

const monthMap: { [key: string]: number } = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'june': 5, 
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
};

export function parseVoiceDate(text: string): string {
    text = text.toLowerCase().replace(/today/g, 'today').replace(/tomorrow/g, 'tomorrow');
    const today = new Date();
    let year = CURRENT_YEAR;
    let month = today.getMonth();
    let day = today.getDate();

    // 1. Check for explicit year
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) {
        year = parseInt(yearMatch[1], 10);
    } else {
        year = CURRENT_YEAR;
    }

    // 2. Check for explicit month
    let monthFound = false;
    for (const [key, value] of Object.entries(monthMap)) {
        if (text.includes(key)) {
            month = value;
            monthFound = true;
            break;
        }
    }

    // 3. Check for day (e.g., "5th", "20", "twenty-one")
    const dayMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (dayMatch) {
        day = parseInt(dayMatch[1], 10);
    } else if (text.includes('today')) {
        day = today.getDate();
    } else if (text.includes('tomorrow')) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);
        year = nextDay.getFullYear();
        month = nextDay.getMonth();
        day = nextDay.getDate();
    }

    // 4. Check for relative terms
    if (!monthFound && !yearMatch) {
        if (text.includes('next week')) {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            year = nextWeek.getFullYear();
            month = nextWeek.getMonth();
            day = nextWeek.getDate();
        } else if (text.includes('next month')) {
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            year = nextMonth.getFullYear();
            month = nextMonth.getMonth();
            day = today.getDate(); 
        } else if (text.includes('next year')) {
            year = CURRENT_YEAR + 1;
        }
    }

    const finalDate = new Date(year, month, day);

    // If date is in past and no year was given, assume next year
    if (!yearMatch && finalDate < today && !text.includes('today')) {
        finalDate.setFullYear(finalDate.getFullYear() + 1);
    }

    return `${finalDate.getFullYear()}-${String(finalDate.getMonth() + 1).padStart(2, '0')}-${String(finalDate.getDate()).padStart(2, '0')}`;
}

export function getExpiryStatus(expiryDateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
        return { 
            colorClass: 'border-l-[6px] border-red-400 animate-[pulse-red_1.5s_infinite]', 
            label: 'Expired / Critical',
            textColor: 'text-red-600'
        };
    } 

    if (diffDays <= 60) {
        return { 
            colorClass: 'border-l-[6px] border-orange-400', 
            label: 'Warning',
            textColor: 'text-orange-600'
        };
    } 

    return { 
        colorClass: 'border-l-[6px] border-green-400', 
        label: 'GOOD',
        textColor: 'text-green-600'
    };
}
