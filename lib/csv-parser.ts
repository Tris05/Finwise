/**
 * CSV Parser utility for credit card data
 * Converts CSV data into structured credit card objects
 */

export interface CSVCreditCard {
  cardName: string
  rating: string
  joiningFee: string
  annualFee: string
  keyBenefits: string
  requiredCibilScore: string
}

export interface ParsedCreditCard {
  id: string
  name: string
  issuer: string
  category: string
  annualFee: number
  joiningFee: number
  creditLimit: string
  interestRate: string
  rewardsRate: string
  image: string
  rating: number
  popularity: string
  targetAudience: string
  cibilScore: {
    min: number
    max?: number
    description: string
  }
  eligibility: {
    minIncome: number
    minAge: number
    maxAge: number
    employmentType: string[]
  }
  features: string[]
  rewards: {
    dining: string
    travel: string
    shopping: string
    fuel: string
    groceries: string
    entertainment: string
  }
  benefits: string[]
  keyBenefits: string[]
  fees: {
    annualFee: number
    joiningFee: number
    latePaymentFee: number
    overlimitFee: number
    cashAdvanceFee: string
    foreignTransactionFee: string
  }
  pros: string[]
  cons: string[]
  bestFor: string[]
  notFor: string[]
}

/**
 * Parse CSV content into structured data
 */
export function parseCSVContent(csvContent: string): CSVCreditCard[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  
  console.log('CSV Headers:', headers)
  console.log('Total lines:', lines.length)
  
  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line)
    const card: any = {}
    
    headers.forEach((header, headerIndex) => {
      // Map CSV headers to our interface fields
      let fieldName = ''
      if (header === 'Card Name') fieldName = 'cardName'
      else if (header === 'Rating') fieldName = 'rating'
      else if (header === 'Joining Fee (₹)') fieldName = 'joiningFee'
      else if (header === 'Annual Fee (₹)') fieldName = 'annualFee'
      else if (header === 'Key Benefits') fieldName = 'keyBenefits'
      else if (header === 'Required CIBIL Score (approx.)') fieldName = 'requiredCibilScore'
      else {
        // Fallback to cleaned header
        fieldName = header.toLowerCase().replace(/\s+/g, '').replace(/[()₹]/g, '')
      }
      
      const value = values[headerIndex]?.replace(/"/g, '').trim() || ''
      card[fieldName] = value
    })
    
    console.log(`Card ${index + 1}:`, card)
    return card as CSVCreditCard
  })
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

/**
 * Parse CIBIL score requirement
 */
export function parseCibilScore(cibilText: string): { min: number; max?: number; description: string } {
  const text = cibilText.toLowerCase()
  
  // Handle different formats
  if (text.includes('no cibil required') || text.includes('poor/no cibil')) {
    return { min: 0, description: 'No CIBIL required' }
  }
  
  if (text.includes('poor') || text.includes('no cibil')) {
    return { min: 0, description: 'Poor/No CIBIL accepted' }
  }
  
  // Extract numeric ranges
  const rangeMatch = text.match(/(\d+)\s*\+\s*\(?([^)]+)\)?/)
  if (rangeMatch) {
    const score = parseInt(rangeMatch[1])
    const description = rangeMatch[2] || `${score}+`
    return { min: score, description: description.trim() }
  }
  
  // Extract single numbers
  const singleMatch = text.match(/(\d+)/)
  if (singleMatch) {
    const score = parseInt(singleMatch[1])
    return { min: score, description: `${score}+` }
  }
  
  return { min: 700, description: cibilText }
}

/**
 * Parse fees from text
 */
export function parseFee(feeText: string): number {
  if (!feeText || feeText.toLowerCase().includes('free') || feeText === '0') {
    return 0
  }
  
  // Remove currency symbols and commas
  const cleaned = feeText.replace(/[₹,\s]/g, '')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Extract issuer from card name
 */
export function extractIssuer(cardName: string): string {
  if (!cardName || typeof cardName !== 'string') {
    return 'Unknown Bank'
  }
  
  const issuers = [
    'HDFC', 'Axis Bank', 'ICICI', 'SBI', 'YES BANK', 'HSBC', 'Tata Neu', 
    'RBL Bank', 'Flipkart', 'Amazon Pay', 'IDFC FIRST', 'Amex', 'BPCL',
    'Kotak', 'AU Bank', 'American Express', 'Federal', 'Kiwi', 'Citi',
    'Bajaj Finserv', 'Bank of Baroda', 'SBM Bank', 'OneCard', 'Suryoday SF Bank'
  ]
  
  for (const issuer of issuers) {
    if (cardName.includes(issuer)) {
      return issuer
    }
  }
  
  return 'Unknown Bank'
}

/**
 * Determine card category based on name and benefits
 */
export function determineCategory(cardName: string, benefits: string): string {
  const name = cardName.toLowerCase()
  const benefitsText = benefits.toLowerCase()
  
  if (name.includes('premium') || name.includes('black') || name.includes('reserve') || name.includes('infinia')) {
    return 'Premium'
  }
  
  if (name.includes('travel') || benefitsText.includes('travel') || benefitsText.includes('lounge')) {
    return 'Travel'
  }
  
  if (name.includes('fuel') || benefitsText.includes('fuel')) {
    return 'Fuel'
  }
  
  if (name.includes('cashback') || benefitsText.includes('cashback')) {
    return 'Cashback'
  }
  
  if (name.includes('secured') || benefitsText.includes('fd')) {
    return 'Secured'
  }
  
  if (name.includes('rewards') || benefitsText.includes('rewards')) {
    return 'Rewards'
  }
  
  return 'General'
}

/**
 * Parse benefits from text
 */
export function parseBenefits(benefitsText: string): string[] {
  if (!benefitsText) return []
  
  // Split by common separators
  const separators = [',', ';', '|', '\n']
  let benefits = [benefitsText]
  
  for (const sep of separators) {
    benefits = benefits.flatMap(b => b.split(sep))
  }
  
  return benefits
    .map(b => b.trim())
    .filter(b => b.length > 0)
    .slice(0, 10) // Limit to 10 benefits
}

/**
 * Calculate rating based on benefits and fees
 */
export function calculateRating(card: CSVCreditCard): number {
  let rating = 3.0 // Base rating
  
  const annualFee = parseFee(card.annualFee)
  const joiningFee = parseFee(card.joiningFee)
  const benefits = parseBenefits(card.keyBenefits)
  
  // Adjust rating based on fees
  if (annualFee === 0 && joiningFee === 0) {
    rating += 1.0 // Free cards get bonus
  } else if (annualFee < 1000) {
    rating += 0.5 // Low fee bonus
  } else if (annualFee > 10000) {
    rating -= 0.5 // High fee penalty
  }
  
  // Adjust rating based on benefits
  const benefitKeywords = [
    'unlimited', 'lounge', 'cashback', 'rewards', 'travel', 'fuel', 
    'dining', 'shopping', 'golf', 'concierge', 'insurance', 'waiver'
  ]
  
  let benefitScore = 0
  benefits.forEach(benefit => {
    benefitKeywords.forEach(keyword => {
      if (benefit.toLowerCase().includes(keyword)) {
        benefitScore += 0.1
      }
    })
  })
  
  rating += Math.min(benefitScore, 1.5) // Cap benefit bonus
  
  // Ensure rating is between 1 and 5
  return Math.max(1, Math.min(5, Math.round(rating * 10) / 10))
}

/**
 * Convert CSV credit card to structured format
 */
export function convertToStructuredCard(csvCard: CSVCreditCard): ParsedCreditCard {
  // Ensure required fields exist
  const cardName = csvCard.cardName || 'Unknown Card'
  const keyBenefits = csvCard.keyBenefits || ''
  const requiredCibilScore = csvCard.requiredCibilScore || '700+'
  
  const issuer = extractIssuer(cardName)
  const category = determineCategory(cardName, keyBenefits)
  const benefits = parseBenefits(keyBenefits)
  const cibilScore = parseCibilScore(requiredCibilScore)
  const rating = calculateRating(csvCard)
  
  // Generate unique ID
  const id = cardName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
  
  return {
    id,
    name: cardName,
    issuer,
    category,
    annualFee: parseFee(csvCard.annualFee),
    joiningFee: parseFee(csvCard.joiningFee),
    creditLimit: category === 'Premium' ? '₹5L - ₹15L' : '₹1L - ₹5L',
    interestRate: '3.5% per month',
    rewardsRate: category === 'Premium' ? '4-6%' : '2-4%',
    image: `/credit-cards/${id}.png`,
    rating,
    popularity: rating > 4 ? 'High' : rating > 3 ? 'Medium' : 'Low',
    targetAudience: category === 'Premium' ? 'High Spenders' : 'General Users',
    cibilScore,
    eligibility: {
      minIncome: category === 'Premium' ? 1000000 : 300000,
      minAge: 21,
      maxAge: 65,
      employmentType: ['Salaried', 'Self-Employed']
    },
    features: benefits.slice(0, 5),
    rewards: {
      dining: category === 'Premium' ? '4X points' : '2X points',
      travel: category === 'Premium' ? '4X points' : '2X points',
      shopping: category === 'Premium' ? '3X points' : '2X points',
      fuel: category === 'Fuel' ? '4X points' : '2X points',
      groceries: '2X points',
      entertainment: '2X points'
    },
    benefits,
    keyBenefits: benefits,
    fees: {
      annualFee: parseFee(csvCard.annualFee),
      joiningFee: parseFee(csvCard.joiningFee),
      latePaymentFee: 500,
      overlimitFee: 500,
      cashAdvanceFee: '2.5%',
      foreignTransactionFee: '3.5%'
    },
    pros: benefits.slice(0, 3),
    cons: ['High annual fee', 'Complex reward structure'],
    bestFor: [category, 'General spending'],
    notFor: ['Low spenders', 'Beginners']
  }
}

/**
 * Process CSV files and return structured credit cards
 */
export async function processCSVFiles(): Promise<ParsedCreditCard[]> {
  try {
    console.log('Starting CSV file processing...')
    
    // Read both CSV files
    const [csv1Response, csv2Response] = await Promise.all([
      fetch('/CardName-Rating-JoiningFee-AnnualFee-KeyBenefits-RequiredCIBILScoreapprox.csv'),
      fetch('/CardName-Rating-JoiningFee-AnnualFee-KeyBenefits-RequiredCIBILScoreapprox (1).csv')
    ])
    
    console.log('CSV Response Status:', {
      file1: csv1Response.status,
      file2: csv2Response.status,
      file1Ok: csv1Response.ok,
      file2Ok: csv2Response.ok
    })
    
    if (!csv1Response.ok || !csv2Response.ok) {
      console.warn('CSV files not found, using fallback data')
      return []
    }
    
    const [csv1Content, csv2Content] = await Promise.all([
      csv1Response.text(),
      csv2Response.text()
    ])
    
    console.log('CSV Content Length:', {
      file1: csv1Content.length,
      file2: csv2Content.length
    })
    
    // Parse CSV content
    const csv1Cards = parseCSVContent(csv1Content)
    const csv2Cards = parseCSVContent(csv2Content)
    
    console.log('Parsed Cards:', {
      file1: csv1Cards.length,
      file2: csv2Cards.length
    })
    
    // Convert to structured format
    const allCards = [...csv1Cards, ...csv2Cards]
    const structuredCards = allCards.map(convertToStructuredCard)
    
    // Remove duplicates based on card name
    const uniqueCards = structuredCards.filter((card, index, self) => 
      index === self.findIndex(c => c.name === card.name)
    )
    
    console.log(`Successfully loaded ${uniqueCards.length} credit cards from CSV`)
    console.log('Sample cards:', uniqueCards.slice(0, 3))
    return uniqueCards
  } catch (error) {
    console.error('Error processing CSV files:', error)
    return []
  }
}
