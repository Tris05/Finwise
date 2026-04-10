
function calculateTaxNewRegime(taxableSalary) {
    let tax = 0
    if (taxableSalary > 400000) {
        if (taxableSalary <= 800000) {
            tax = (taxableSalary - 400000) * 0.05
        } else if (taxableSalary <= 1200000) {
            tax = 20000 + (taxableSalary - 800000) * 0.10
        } else if (taxableSalary <= 1600000) {
            tax = 60000 + (taxableSalary - 1200000) * 0.15
        } else if (taxableSalary <= 2000000) {
            tax = 120000 + (taxableSalary - 1600000) * 0.20
        } else if (taxableSalary <= 2400000) {
            tax = 200000 + (taxableSalary - 2000000) * 0.25
        } else {
            tax = 300000 + (taxableSalary - 2400000) * 0.30
        }
    }
    if (taxableSalary <= 1200000) tax = 0
    return tax * 1.04
}

function calculateTaxOldRegime(taxableSalary) {
    let tax = 0
    if (taxableSalary > 250000) {
        if (taxableSalary <= 500000) {
            tax = (taxableSalary - 250000) * 0.05
        } else if (taxableSalary <= 1000000) {
            tax = 12500 + (taxableSalary - 500000) * 0.20
        } else {
            tax = 112500 + (taxableSalary - 1000000) * 0.30
        }
    }
    if (taxableSalary <= 500000) tax = 0
    return tax * 1.04
}

const testCases = [
    { income: 1200000, regime: "new", expected: 0 },
    { income: 1500000, regime: "new", expected: 109200 }, // (20k + 40k + 45k) * 1.04 = 105k * 1.04 = 109.2k -- wait, 12L-15L is 3L * 15% = 45k. 8L-12L is 4L * 10% = 40k. 4L-8L is 4L * 5% = 20k. Total 105k. Correct.
    { income: 1000000, regime: "old", expected: 117000 }, // (12.5k + 100k) * 1.04 = 112.5k * 1.04 = 117k
]

console.log("Tax Verification (FY 2025-26):")
testCases.forEach(tc => {
    const tax = tc.regime === "new" ? calculateTaxNewRegime(tc.income) : calculateTaxOldRegime(tc.income);
    console.log(`Income: ${tc.income}, Regime: ${tc.regime} -> Tax: ${tax} (Expected: ~${tc.expected})`);
})
