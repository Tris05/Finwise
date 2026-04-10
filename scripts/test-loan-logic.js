
function calculateEMI(principal, annualRate, termMonths) {
    if (annualRate === 0) {
        return principal / termMonths;
    }

    const monthlyRate = annualRate / 100 / 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

    return Math.round(emi * 100) / 100;
}

function calculateStress(emi, monthlyIncome) {
    const stress = (emi / monthlyIncome) * 100;
    return Math.round(Math.min(100, stress));
}

const testCases = [
    { principal: 5000000, rate: 8.5, tenure: 240, income: 100000 },
    { principal: 1000000, rate: 9, tenure: 60, income: 50000 },
    { principal: 2000000, rate: 8, tenure: 120, income: 75000 }
];

console.log("Loan Logic Verification:");
testCases.forEach(tc => {
    const emi = calculateEMI(tc.principal, tc.rate, tc.tenure);
    const stress = calculateStress(emi, tc.income);
    console.log(`Principal: ₹${tc.principal.toLocaleString()}, Rate: ${tc.rate}%, Tenure: ${tc.tenure}mo, Income: ₹${tc.income.toLocaleString()}`);
    console.log(`-> EMI: ₹${emi.toLocaleString()}, Stress: ${stress}%`);
});
