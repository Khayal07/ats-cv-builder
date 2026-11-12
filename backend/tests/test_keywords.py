from app.services.keywords import extract_keywords, skill_catalog


def terms(text: str, **kwargs) -> list[str]:
    return [keyword.term for keyword in extract_keywords(text, **kwargs)]


def by_term(text: str) -> dict:
    return {keyword.term: keyword for keyword in extract_keywords(text)}


class TestSkills:
    def test_maps_synonyms_to_canonical_names(self):
        found = terms("We need JS, k8s and Postgres experience.")
        assert {"JavaScript", "Kubernetes", "PostgreSQL"} <= set(found)

    def test_matches_multi_word_aliases(self):
        found = terms("Deploy on Amazon Web Services. Build RESTful APIs and CI/CD pipelines.")
        assert {"AWS", "REST", "CI/CD"} <= set(found)

    def test_keeps_symbols_in_skill_names(self):
        assert {"C++", "C#", ".NET", "Node.js"} <= set(terms("C++, C#, .NET or Node.js"))

    def test_does_not_find_java_inside_javascript(self):
        found = terms("Strong JavaScript skills")
        assert "JavaScript" in found
        assert "Java" not in found

    def test_weight_is_doubled_and_frequency_capped_at_three(self):
        keywords = by_term("Python. Python. Python. Python. Python. Docker.")
        assert keywords["Python"].weight == 6.0
        assert keywords["Docker"].weight == 2.0
        assert keywords["Python"].category == "skill"

    def test_synonym_occurrences_count_toward_one_skill(self):
        assert by_term("JS and JavaScript and ECMAScript")["JavaScript"].weight == 6.0


class TestPhrases:
    def test_repeated_phrase_becomes_keyword(self):
        text = (
            "Own stakeholder management for launches. Stakeholder management across regions is key."
        )
        keywords = by_term(text)
        assert "stakeholder management" in keywords
        assert keywords["stakeholder management"].category == "phrase"
        assert keywords["stakeholder management"].weight == 2.0

    def test_longer_phrase_absorbs_its_parts(self):
        text = "Payment fraud detection. We value payment fraud detection."
        found = terms(text)
        assert "payment fraud detection" in found
        assert "payment fraud" not in found
        assert "payment" not in found

    def test_single_occurrence_generic_words_are_ignored(self):
        assert terms("Design scalable distributed systems") == []

    def test_generic_verbs_are_not_keywords_even_when_repeated(self):
        text = "Build services. Design services. Build and design services."
        assert terms(text) == []

    def test_stopwords_and_noise_words_are_never_keywords(self):
        text = "Experience experience years years strong strong team team the the"
        assert terms(text) == []


class TestRankingAndLanguages:
    def test_orders_by_weight_then_first_appearance(self):
        found = terms("Docker and Python. Python and Kafka.")
        assert found == ["Python", "Docker", "Kafka"]

    def test_limits_results(self):
        text = ", ".join(skill.name for skill in skill_catalog()[:40])
        assert len(terms(text, top_n=10)) == 10

    def test_handles_azerbaijani_job_description(self):
        text = (
            "Python və Django üzrə təcrübə. Komanda ilə işləmək bacarığı. "
            "Komanda ilə işləmək vacibdir."
        )
        found = terms(text)
        assert "Python" in found and "Django" in found
        assert "və" not in found and "ilə" not in found

    def test_empty_text_has_no_keywords(self):
        assert terms("   ") == []


def test_catalog_aliases_are_unique():
    seen = {}
    for skill in skill_catalog():
        for alias in skill.aliases:
            assert alias not in seen, f"{alias} used by {seen.get(alias)} and {skill.name}"
            seen[alias] = skill.name
