export type TopicChoice = "auto" | "unsorted" | string;

export function resolveTopicChoice(choice: TopicChoice, viewedTopicId: string | null) {
  if (choice === "auto") {
    return viewedTopicId
      ? { topicId: viewedTopicId, shouldAutoFile: false, explicitTopic: false }
      : { topicId: null, shouldAutoFile: true, explicitTopic: false };
  }

  if (choice === "unsorted") {
    return { topicId: null, shouldAutoFile: false, explicitTopic: false };
  }

  return { topicId: choice, shouldAutoFile: false, explicitTopic: true };
}