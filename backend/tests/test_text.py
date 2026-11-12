import pytest

from app.services.text import (
    is_stopword,
    normalize_key,
    segments,
    tokenize,
)


def keys(text: str) -> list[str]:
    return [token.key for token in tokenize(text)]


class TestNormalizeKey:
    def test_lowercases_ascii(self):
        assert normalize_key("Python") == "python"

    def test_dotted_capital_i_becomes_plain_i(self):
        # Python's default lower() turns "İ" into "i" + combining dot; we must not.
        assert normalize_key("İstanbul") == "istanbul"
        assert normalize_key("İŞ") == "iş"

    @pytest.mark.parametrize("variant", ["IŞIQ", "ışıq", "İşıq", "Işıq"])
    def test_azerbaijani_i_variants_share_one_key(self, variant):
        assert normalize_key(variant) == normalize_key("işiq")

    def test_keeps_other_azerbaijani_letters(self):
        assert normalize_key("Təcrübə ŞƏHƏR Gəncə") == "təcrübə şəhər gəncə"

    def test_applies_nfc(self):
        assert normalize_key("é") == "é"


class TestTokenize:
    @pytest.mark.parametrize(
        ("text", "expected"),
        [
            ("C++ and C#", ["c++", "and", "c#"]),
            ("We use .NET and ASP.NET", ["we", "use", ".net", "and", "asp.net"]),
            ("Node.js, Next.js.", ["node.js", "next.js"]),
            ("CI/CD with scikit-learn", ["ci/cd", "with", "scikit-learn"]),
            ("AWS EC2, S3 and p95 latency", ["aws", "ec2", "s3", "and", "p95", "latency"]),
            ("React.", ["react"]),
        ],
    )
    def test_keeps_technical_tokens(self, text, expected):
        assert keys(text) == expected

    def test_keeps_surface_form(self):
        tokens = tokenize("Kubernetes and PostgreSQL")
        assert [t.surface for t in tokens] == ["Kubernetes", "and", "PostgreSQL"]

    def test_handles_azerbaijani_words(self):
        assert keys("Təcrübəli proqramçı, Bakı şəhəri") == [
            "təcrübəli",
            "proqramçi",
            "baki",
            "şəhəri",
        ]

    def test_ignores_punctuation_and_symbols(self):
        assert keys("— • (React) | [Vue] !!!") == ["react", "vue"]


class TestSegments:
    def test_splits_on_commas_bullets_newlines_and_sentence_ends(self):
        text = "Strong Python skills, REST APIs\n• Docker. Kubernetes is a plus; GraphQL"
        assert [[t.key for t in seg] for seg in segments(text)] == [
            ["strong", "python", "skills"],
            ["rest", "apis"],
            ["docker"],
            ["kubernetes", "is", "a", "plus"],
            ["graphql"],
        ]

    def test_does_not_split_inside_dotted_tokens(self):
        assert [[t.key for t in seg] for seg in segments("Node.js and ASP.NET Core")] == [
            ["node.js", "and", "asp.net", "core"]
        ]

    def test_skips_empty_segments(self):
        assert segments(" ,, \n\n ;") == []


class TestStopwords:
    @pytest.mark.parametrize("word", ["the", "and", "with", "və", "üçün", "ilə", "bir"])
    def test_common_words_are_stopwords(self, word):
        assert is_stopword(normalize_key(word))

    @pytest.mark.parametrize("word", ["python", "docker", "təcrübə", "c++"])
    def test_content_words_are_not_stopwords(self, word):
        assert not is_stopword(normalize_key(word))
