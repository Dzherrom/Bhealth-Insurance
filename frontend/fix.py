import re

with open('app/crm/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = r"const getDefaultRange = \(\) => \{.+?export default function DashboardPage\(\) \{"

new_content = \"\"\"const getDefaultRange = () => {
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
    startDate: f"{startYYYY}-{startMM}-{startDD}",
    endDate: f"{endYYYY}-{endMM}-{endDD}",
  };
};

export default function DashboardPage() {\"\"\"

new_content = new_content.replace('f"{startYYYY}-{startMM}-{startDD}"', '${startYYYY}--')
new_content = new_content.replace('f"{endYYYY}-{endMM}-{endDD}"', '${endYYYY}--')

text = re.sub(pattern, new_content, text, flags=re.DOTALL)

with open('app/crm/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
