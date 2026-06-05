export function alertCards(alerts, { limit = 6 } = {}) {
  return alerts.slice(0, limit).map((message, index) => ({
    id: `alert-${index}-${slug(message)}`,
    message,
    ...classifyAlert(message)
  }));
}

export function classifyAlert(message) {
  const text = String(message ?? "");
  if (/^Victory\b/i.test(text)) {
    return meta("success", "Outcome", "V", "success");
  }
  if (/^Defeat\b/i.test(text)) {
    return meta("critical", "Outcome", "!", "critical");
  }
  if (/^Need\b/i.test(text)) {
    return meta("warning", "Economy", "!", "warning");
  }
  if (/^(Cannot place|Requires|Build and finish|Shared producer|No active producer)/i.test(text)) {
    return meta("warning", "Build", "!", "warning");
  }
  if (/^(No squad|Selection cleared|\d+\s+squad order|.*selected\.)/i.test(text) || /\b(retreat|hold|rally|attack move|capture|stance|formation|priority)\b/i.test(text)) {
    return meta("command", "Command", ">", "alert");
  }
  if (/\b(T2|T3|research started|research is already|research complete)\b/i.test(text)) {
    return meta("info", "Research", "^", "alert");
  }
  if (/\b(recruited|ability|ordered|level)\b/i.test(text)) {
    return meta("info", "Hero", "*", "alert");
  }
  if (/\b(queued|ready|complete|foundation placed|producer|production)\b/i.test(text)) {
    return meta("info", "Production", "+", "alert");
  }
  if (/\b(captured|Moon Pool|Witchglass|Watcher|Shard)\b/i.test(text)) {
    return meta("objective", "Objective", "*", "alert");
  }
  return meta("info", "Notice", "i", "alert");
}

function meta(tone, category, icon, suffix) {
  return {
    tone,
    category,
    icon,
    label: `${category} ${suffix}`
  };
}

function slug(message) {
  const value = String(message ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return value || "notice";
}
