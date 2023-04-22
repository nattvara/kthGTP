from typing import List


def create_classification_prompt_for_subjects(
    what_to_classify: str,
    number_of_labels: int,
    labels: List[str],
    text_to_classify: str,
):
    subjects_str = ''
    for label in labels:
        subjects_str += label + '\n'

    return f'''
Consider the following {what_to_classify.lower()}, and the following list of subjects. Classify which
subjects the assignment belongs to. Choose {number_of_labels} subjects. Decision should have one subject per line.

{what_to_classify.title()}:
{text_to_classify}

Subjects:
{subjects_str}

Decision:
'''.strip()
