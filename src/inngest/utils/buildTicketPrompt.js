export const buildTicketPrompt = (rawDescription, departments) => {
  const departmentList = departments
    .map((d) => `- ${d.name}: ${d.description || "No description"}`)
    .join("\n");

  return `
Patient's description:
"${rawDescription}"

Available departments (choose matchedDepartment from EXACTLY this list, using the department name as written):
${departmentList}

Instructions:
- If the description clearly and confidently matches ONE department, set confidence to HIGH and leave clarifyingQuestions as an empty array.
- If the description is vague or could reasonably match more than one department, set confidence to MEDIUM or LOW, and provide 2-3 yes/no questions that would help distinguish between the likely departments. Still provide your best guess for matchedDepartment even at LOW confidence.

Analyze the patient's description and call submit_ticket_analysis with your findings.
`;
};
