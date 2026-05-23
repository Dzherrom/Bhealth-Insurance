const fs = require('fs');
let text = fs.readFileSync('app/crm/dashboard/page.tsx', 'utf8');

const regex = /const getDefaultRange = \(\) => \{[\s\S]*?export default function DashboardPage\(\) \{/;

const newContent = const getDefaultRange = () => {
  const endDateObj = new Date();
  const startDateObj = new Date();
  startDateObj.setMonth(startDateObj.getMonth() - 6);
  
  const endYYYY = endDateObj.getFullYear();
  const endMM = String(endDateObj.getMonth() + 1).padStart(2, '0');
  const endDD = String(endDateObj.getDate()).padStart(2, '0');

  const startYYYY = startDateObj.getFullYear();
  const startMM = String(startDateObj.getMonth() + 1).padStart(2, '0');
  const startDD = String(startDateObj.getDate()).padStart(2, '0');

  return {
    startDate: \\-\-\\,
    endDate: \\-\-\\,
  };
};

export default function DashboardPage() {;

if (regex.test(text)) {
  text = text.replace(regex, newContent);
  fs.writeFileSync('app/crm/dashboard/page.tsx', text, 'utf8');
  console.log('Successfully updated getDefaultRange');
} else {
  console.log('Could not find regex match');
}
