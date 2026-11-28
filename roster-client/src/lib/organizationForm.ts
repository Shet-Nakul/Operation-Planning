export type OrganizationDetails = { name: string; location: string; contact_email: string; contact_number: string };

export function organizationUpdate(details: OrganizationDetails, currentEmail: string | null | undefined) {
  const email = details.contact_email.trim();
  if (!email && currentEmail) throw new Error('The server does not support clearing the contact email. Enter an email address to save.');
  return {
    name: details.name.trim(),
    location: details.location.trim(),
    contact_number: details.contact_number.trim(),
    ...(email ? { contact_email: email } : {}),
  };
}
