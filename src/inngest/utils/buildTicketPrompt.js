export const buildTicketPrompt = (rawDescription, departments) => {
  const departmentList = departments
    .map((d) => `- ${d.name}: ${d.description || "No description"}`)
    .join("\n");

  return `
Patient's description:
"${rawDescription}"

Available departments (choose matchedDepartment from EXACTLY this list, using the department name as written):
${departmentList}

Analyze the patient's description and call submit_ticket_analysis with your findings.
`;
};
