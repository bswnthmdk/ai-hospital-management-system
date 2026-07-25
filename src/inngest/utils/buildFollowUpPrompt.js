export const buildFollowUpPrompt = (
  rawDescription,
  departments,
  clarifyingQA,
) => {
  const departmentList = departments
    .map((d) => `- ${d.name}: ${d.description || "No description"}`)
    .join("\n");

  const qaList = clarifyingQA
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join("\n\n");

  return `
Patient's original description:
"${rawDescription}"

Follow-up questions and the patient's answers:
${qaList}

Available departments (choose matchedDepartment from EXACTLY this list):
${departmentList}

This is your FINAL decision — do not ask further questions, clarifyingQuestions must be an empty array. Use the original description plus the answers above to give your best final matchedDepartment and confidence.

Call submit_ticket_analysis with your findings.
`;
};
