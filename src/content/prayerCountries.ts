// "Pray for the World" - Feature 20. A day-of-year -> country mapping so
// every day of the year has one featured nation, and any two kids opening
// this on the same day land on the same country (group prayer, not a
// personal pick). Flags are computed from the ISO 3166-1 code, not stored
// as separate assets.

export interface PrayerCountry {
  code: string
  name: string
  focus: string
}

// A broad, real spread across every continent - not exhaustive of all ~195
// sovereign states, but wide enough that "map countries across the days of
// the year" actually means something rather than a token handful.
export const PRAYER_COUNTRIES: PrayerCountry[] = [
  { code: 'NG', name: 'Nigeria', focus: 'Pray for the church here and for children to know God early.' },
  { code: 'GH', name: 'Ghana', focus: 'Pray for strong Christian families and honest leaders.' },
  { code: 'KE', name: 'Kenya', focus: 'Pray for growth in the church and peace among neighbors.' },
  { code: 'ET', name: 'Ethiopia', focus: 'Pray for one of the oldest churches in the world to keep shining.' },
  { code: 'EG', name: 'Egypt', focus: 'Pray for Christians who worship boldly despite pressure.' },
  { code: 'ZA', name: 'South Africa', focus: 'Pray for unity across many different peoples.' },
  { code: 'TZ', name: 'Tanzania', focus: 'Pray for teachers bringing the gospel to new villages.' },
  { code: 'UG', name: 'Uganda', focus: 'Pray for children orphaned by hardship to find family and faith.' },
  { code: 'CM', name: 'Cameroon', focus: 'Pray for peace between communities in conflict.' },
  { code: 'SN', name: 'Senegal', focus: 'Pray for small but faithful Christian communities.' },
  { code: 'CI', name: "Cote d'Ivoire", focus: 'Pray for healing after years of division.' },
  { code: 'ZM', name: 'Zambia', focus: 'Pray for a nation that calls itself Christian to live it out.' },
  { code: 'ZW', name: 'Zimbabwe', focus: 'Pray for hope in the middle of hard economic times.' },
  { code: 'RW', name: 'Rwanda', focus: 'Pray for the forgiveness and healing still happening here.' },
  { code: 'SL', name: 'Sierra Leone', focus: 'Pray for rebuilding after war, sickness, and loss.' },
  { code: 'LR', name: 'Liberia', focus: 'Pray for a new generation growing up in peace.' },
  { code: 'ML', name: 'Mali', focus: 'Pray for safety for believers who are a small minority.' },
  { code: 'NE', name: 'Niger', focus: 'Pray for the very few Christians here to be strengthened.' },
  { code: 'BF', name: 'Burkina Faso', focus: 'Pray for families displaced by unrest to find safety.' },
  { code: 'MZ', name: 'Mozambique', focus: 'Pray for those recovering from storms and conflict.' },
  { code: 'MW', name: 'Malawi', focus: 'Pray for one of the friendliest, most welcoming nations.' },
  { code: 'AO', name: 'Angola', focus: 'Pray for a growing church to disciple new believers well.' },
  { code: 'BW', name: 'Botswana', focus: 'Pray for steady, faithful growth in the church here.' },
  { code: 'NA', name: 'Namibia', focus: 'Pray for wide, empty lands and the small towns that dot them.' },
  { code: 'GA', name: 'Gabon', focus: 'Pray for the gospel to reach deep into the forest regions.' },
  { code: 'CD', name: 'DR Congo', focus: 'Pray for peace in a nation that has known so much conflict.' },
  { code: 'CG', name: 'Congo', focus: 'Pray for stability and for the church to keep growing.' },
  { code: 'SD', name: 'Sudan', focus: 'Pray for believers facing real pressure for their faith.' },
  { code: 'SS', name: 'South Sudan', focus: 'Pray for peace for the world’s youngest country.' },
  { code: 'SO', name: 'Somalia', focus: 'Pray for the tiny, quiet church here to be protected.' },
  { code: 'IL', name: 'Israel', focus: 'Pray for peace in Jerusalem and for the land where Jesus walked.' },
  { code: 'PS', name: 'Palestine', focus: 'Pray for peace and comfort for families here.' },
  { code: 'JO', name: 'Jordan', focus: 'Pray for the churches that host refugees from every direction.' },
  { code: 'LB', name: 'Lebanon', focus: 'Pray for a nation rebuilding again and again.' },
  { code: 'SY', name: 'Syria', focus: 'Pray for families still recovering from years of war.' },
  { code: 'IQ', name: 'Iraq', focus: 'Pray for the ancient church here to keep its light burning.' },
  { code: 'IR', name: 'Iran', focus: 'Pray for the underground church growing in secret.' },
  { code: 'TR', name: 'Turkey', focus: 'Pray for the cities Paul once wrote letters to.' },
  { code: 'SA', name: 'Saudi Arabia', focus: 'Pray for the small hidden community of believers here.' },
  { code: 'YE', name: 'Yemen', focus: 'Pray for a country facing famine and war.' },
  { code: 'AE', name: 'United Arab Emirates', focus: 'Pray for workers from all over the world living here.' },
  { code: 'AF', name: 'Afghanistan', focus: 'Pray for courage for the very few believers here.' },
  { code: 'PK', name: 'Pakistan', focus: 'Pray for Christians who are a minority but stand firm.' },
  { code: 'IN', name: 'India', focus: 'Pray for the huge and diverse church across every state.' },
  { code: 'NP', name: 'Nepal', focus: 'Pray for the fast-growing church in the mountains.' },
  { code: 'BD', name: 'Bangladesh', focus: 'Pray for small churches among a huge population.' },
  { code: 'MM', name: 'Myanmar', focus: 'Pray for peace between many different peoples here.' },
  { code: 'LK', name: 'Sri Lanka', focus: 'Pray for healing after years of conflict.' },
  { code: 'TH', name: 'Thailand', focus: 'Pray for missionaries serving among Buddhist communities.' },
  { code: 'VN', name: 'Vietnam', focus: 'Pray for house churches meeting quietly and faithfully.' },
  { code: 'LA', name: 'Laos', focus: 'Pray for the small church here to be encouraged.' },
  { code: 'KH', name: 'Cambodia', focus: 'Pray for a young generation rebuilding after hard history.' },
  { code: 'MY', name: 'Malaysia', focus: 'Pray for believers navigating many faiths and cultures.' },
  { code: 'ID', name: 'Indonesia', focus: 'Pray for the church spread across thousands of islands.' },
  { code: 'PH', name: 'Philippines', focus: 'Pray for one of Asia’s largest Christian populations.' },
  { code: 'CN', name: 'China', focus: 'Pray for house churches and for freedom to worship openly.' },
  { code: 'MN', name: 'Mongolia', focus: 'Pray for the small but growing church on the steppe.' },
  { code: 'KP', name: 'North Korea', focus: 'Pray for believers living out their faith in total secrecy.' },
  { code: 'KR', name: 'South Korea', focus: 'Pray for churches here to keep sending missionaries worldwide.' },
  { code: 'JP', name: 'Japan', focus: 'Pray for a tiny Christian minority to shine brightly.' },
  { code: 'RU', name: 'Russia', focus: 'Pray for believers across the largest country on earth.' },
  { code: 'UA', name: 'Ukraine', focus: 'Pray for peace, comfort, and rebuilding after war.' },
  { code: 'PL', name: 'Poland', focus: 'Pray for a strong Christian heritage to keep bearing fruit.' },
  { code: 'DE', name: 'Germany', focus: 'Pray for renewal in churches that have grown quiet.' },
  { code: 'FR', name: 'France', focus: 'Pray for the gospel to take root again in this nation.' },
  { code: 'GB', name: 'United Kingdom', focus: 'Pray for churches here to be filled with young families.' },
  { code: 'IE', name: 'Ireland', focus: 'Pray for a fresh move of faith among a new generation.' },
  { code: 'ES', name: 'Spain', focus: 'Pray for growing evangelical churches here.' },
  { code: 'PT', name: 'Portugal', focus: 'Pray for the small but faithful evangelical community.' },
  { code: 'IT', name: 'Italy', focus: 'Pray for renewal in the land of the early church fathers.' },
  { code: 'GR', name: 'Greece', focus: 'Pray for the churches Paul once wrote to directly.' },
  { code: 'NL', name: 'Netherlands', focus: 'Pray for churches navigating a very secular culture.' },
  { code: 'BE', name: 'Belgium', focus: 'Pray for unity and faith across two very different regions.' },
  { code: 'SE', name: 'Sweden', focus: 'Pray for a spiritual hunger to return here.' },
  { code: 'NO', name: 'Norway', focus: 'Pray for churches to reach a comfortable, secular society.' },
  { code: 'FI', name: 'Finland', focus: 'Pray for light in the long winters, spiritually and literally.' },
  { code: 'DK', name: 'Denmark', focus: 'Pray for a new hunger for God among young people.' },
  { code: 'RO', name: 'Romania', focus: 'Pray for a vibrant, growing evangelical movement.' },
  { code: 'HU', name: 'Hungary', focus: 'Pray for the church to keep influencing the culture.' },
  { code: 'CZ', name: 'Czechia', focus: 'Pray for one of the least religious nations in Europe.' },
  { code: 'AT', name: 'Austria', focus: 'Pray for renewal in historic church communities.' },
  { code: 'CH', name: 'Switzerland', focus: 'Pray for the roots of the Reformation to bear fresh fruit.' },
  { code: 'AL', name: 'Albania', focus: 'Pray for a nation still rebuilding its faith after decades of atheism.' },
  { code: 'BA', name: 'Bosnia and Herzegovina', focus: 'Pray for peace between three faiths sharing one land.' },
  { code: 'RS', name: 'Serbia', focus: 'Pray for healing between old divisions.' },
  { code: 'BG', name: 'Bulgaria', focus: 'Pray for the church to reach every region, not just the cities.' },
  { code: 'GE', name: 'Georgia', focus: 'Pray for the ancient church here to stay strong.' },
  { code: 'AM', name: 'Armenia', focus: 'Pray for one of the very first Christian nations.' },
  { code: 'AZ', name: 'Azerbaijan', focus: 'Pray for the small church here to be protected.' },
  { code: 'KZ', name: 'Kazakhstan', focus: 'Pray for freedom to worship across Central Asia.' },
  { code: 'UZ', name: 'Uzbekistan', focus: 'Pray for the underground church to be encouraged.' },
  { code: 'US', name: 'United States', focus: 'Pray for the church here to stay focused on the gospel.' },
  { code: 'CA', name: 'Canada', focus: 'Pray for renewal among a new generation of believers.' },
  { code: 'MX', name: 'Mexico', focus: 'Pray for growing evangelical churches across the country.' },
  { code: 'GT', name: 'Guatemala', focus: 'Pray for strong discipleship in a very Christian nation.' },
  { code: 'HN', name: 'Honduras', focus: 'Pray for safety and hope amid difficult conditions.' },
  { code: 'CU', name: 'Cuba', focus: 'Pray for churches that have grown despite years of restriction.' },
  { code: 'HT', name: 'Haiti', focus: 'Pray for rebuilding, healing, and hope after hardship.' },
  { code: 'DO', name: 'Dominican Republic', focus: 'Pray for the church to keep growing in influence.' },
  { code: 'JM', name: 'Jamaica', focus: 'Pray for a nation with deep gospel roots to stay rooted.' },
  { code: 'CO', name: 'Colombia', focus: 'Pray for peace and for the church’s continued growth.' },
  { code: 'VE', name: 'Venezuela', focus: 'Pray for provision and hope during hard economic years.' },
  { code: 'EC', name: 'Ecuador', focus: 'Pray for missionaries serving remote communities.' },
  { code: 'PE', name: 'Peru', focus: 'Pray for the gospel to reach deep into the Andes.' },
  { code: 'BO', name: 'Bolivia', focus: 'Pray for the church among many indigenous peoples.' },
  { code: 'BR', name: 'Brazil', focus: 'Pray for one of the largest Christian populations on earth.' },
  { code: 'PY', name: 'Paraguay', focus: 'Pray for strong, growing local churches.' },
  { code: 'UY', name: 'Uruguay', focus: 'Pray for spiritual hunger in a very secular society.' },
  { code: 'AR', name: 'Argentina', focus: 'Pray for revival to keep spreading through the churches.' },
  { code: 'CL', name: 'Chile', focus: 'Pray for unity across many different church movements.' },
  { code: 'AU', name: 'Australia', focus: 'Pray for churches reaching a busy, distracted culture.' },
  { code: 'NZ', name: 'New Zealand', focus: 'Pray for renewal among young people here.' },
  { code: 'PG', name: 'Papua New Guinea', focus: 'Pray for Bible translation reaching every language group.' },
  { code: 'FJ', name: 'Fiji', focus: 'Pray for the strong faith already present to keep growing.' },
]

export function flagEmoji(code: string): string {
  const upper = code.toUpperCase()
  return String.fromCodePoint(...[...upper].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65)))
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

/** Deterministic - anyone opening this on the same calendar day sees the same country, which is the point (group prayer, not a personal pick). */
export function getCountryForDate(date: Date): PrayerCountry {
  const idx = dayOfYear(date) % PRAYER_COUNTRIES.length
  return PRAYER_COUNTRIES[idx]
}

export function getCountryForOffset(date: Date, offsetDays: number): PrayerCountry {
  const shifted = new Date(date)
  shifted.setDate(shifted.getDate() + offsetDays)
  return getCountryForDate(shifted)
}
