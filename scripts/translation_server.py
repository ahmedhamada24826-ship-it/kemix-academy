#!/usr/bin/env python3
import json
import logging
import os
import re
import tempfile
import threading
import zipfile
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from urllib.error import URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import ctranslate2
import sentencepiece as spm


HOST = "127.0.0.1"
PORT = 5000
MODEL_ROOT = Path(
    os.environ.get(
        "LOCAL_TRANSLATION_MODEL_DIR",
        str(Path.home() / ".cache" / "kemix-academy" / "translation"),
    )
)
MODEL_URLS = {
    ("ar", "en"): "https://argos-net.com/v1/translate-ar_en-1_0.argosmodel",
    ("en", "ar"): "https://argos-net.com/v1/translate-en_ar-1_0.argosmodel",
}
MAX_MODEL_ARCHIVE_BYTES = 150_000_000
MAX_EXTRACTED_MODEL_BYTES = 500_000_000
MAX_BODY_BYTES = 256_000
MAX_TEXTS = 24
MAX_TEXT_LENGTH = 8_000
MAX_TOTAL_TEXT_LENGTH = 48_000
MAX_CACHE_ENTRIES = 5_000

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("kemix-local-translation")
translation_cache: OrderedDict[tuple[str, str, str], str] = OrderedDict()
translation_cache_lock = threading.Lock()


class TranslationModel:
    def __init__(self, source: str, target: str, package_path: Path):
        self.source = source
        self.target = target
        self.package_path = package_path
        self.tokenizer = spm.SentencePieceProcessor(
            model_file=str(package_path / "sentencepiece.model")
        )
        self.translator = ctranslate2.Translator(
            str(package_path / "model"),
            device="cpu",
            inter_threads=1,
            intra_threads=max(1, min(os.cpu_count() or 1, 4)),
            compute_type="int8",
        )
        with (package_path / "metadata.json").open(encoding="utf-8") as metadata_file:
            self.target_prefix = json.load(metadata_file).get("target_prefix", "")
        self.lock = threading.Lock()

    def translate_many(self, texts: list[str]) -> list[str]:
        sentence_groups = [
            re.split(r"(?<=[.!?؟؛])(?=\s)", text)
            for text in texts
        ]
        sentence_locations = [
            (text_index, sentence_index)
            for text_index, sentences in enumerate(sentence_groups)
            for sentence_index, sentence in enumerate(sentences)
            if sentence.strip()
        ]
        if not sentence_locations:
            return texts

        encoded_sentences = [
            self.tokenizer.encode(sentence_groups[text_index][sentence_index], out_type=str)
            for text_index, sentence_index in sentence_locations
        ]
        target_prefix = (
            [[self.target_prefix] for _ in encoded_sentences]
            if self.target_prefix
            else None
        )
        with self.lock:
            translated = self.translator.translate_batch(
                encoded_sentences,
                target_prefix=target_prefix,
                replace_unknowns=True,
                max_batch_size=16,
                batch_type="tokens",
                beam_size=1,
                num_hypotheses=1,
                length_penalty=0.2,
            )

        if len(translated) != len(sentence_locations):
            raise RuntimeError("The offline model returned an incomplete translation batch.")

        for (text_index, sentence_index), result in zip(sentence_locations, translated):
            if not result.hypotheses or not result.hypotheses[0]:
                raise RuntimeError("The offline model returned an empty translation.")
            output = self.tokenizer.decode_pieces(result.hypotheses[0])
            output = output.replace("▁", " ").replace("_", " ")
            if self.target_prefix and output.startswith(self.target_prefix):
                output = output[len(self.target_prefix):]
            if output.startswith(" "):
                output = output[1:]
            if not output.strip():
                raise RuntimeError("The offline model returned an empty translation.")
            sentence_groups[text_index][sentence_index] = output

        return ["".join(sentences) for sentences in sentence_groups]


models: dict[tuple[str, str], TranslationModel] = {}
models_lock = threading.Lock()


def _validate_archive_paths(archive: zipfile.ZipFile) -> int:
    total_size = 0
    for member in archive.infolist():
        path = PurePosixPath(member.filename)
        if path.is_absolute() or ".." in path.parts:
            raise RuntimeError("The offline model archive contains an unsafe path.")
        total_size += member.file_size
        if total_size > MAX_EXTRACTED_MODEL_BYTES:
            raise RuntimeError("The offline model archive exceeds the extraction limit.")
    return total_size


def _download_model(source: str, target: str, destination: Path) -> Path:
    pair_name = f"{source}-{target}"
    package_path = destination / pair_name
    metadata_path = package_path / "metadata.json"
    if metadata_path.is_file():
        with metadata_path.open(encoding="utf-8") as metadata_file:
            metadata = json.load(metadata_file)
        if (
            metadata.get("from_code") == source
            and metadata.get("to_code") == target
            and (package_path / "model" / "model.bin").is_file()
            and (package_path / "sentencepiece.model").is_file()
        ):
            return package_path
        raise RuntimeError(f"The cached {source}->{target} model is incomplete or invalid.")

    destination.mkdir(parents=True, exist_ok=True)
    archive_path = destination / f"{pair_name}.argosmodel"
    if not archive_path.is_file():
        url = MODEL_URLS[(source, target)]
        logger.info("Downloading the offline %s->%s model.", source, target)
        request = Request(url, headers={"User-Agent": "Kemix-Academy local translator"})
        partial_path = destination / f"{pair_name}.argosmodel.part"
        total_bytes = 0
        try:
            with urlopen(request, timeout=60) as response, partial_path.open("wb") as output:
                content_length = response.headers.get("Content-Length")
                if content_length and int(content_length) > MAX_MODEL_ARCHIVE_BYTES:
                    raise RuntimeError("The offline model archive exceeds the download limit.")
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > MAX_MODEL_ARCHIVE_BYTES:
                        raise RuntimeError("The offline model archive exceeds the download limit.")
                    output.write(chunk)
            partial_path.replace(archive_path)
        except (OSError, URLError, ValueError) as error:
            partial_path.unlink(missing_ok=True)
            raise RuntimeError(f"Unable to download the {source}->{target} offline model.") from error
        finally:
            partial_path.unlink(missing_ok=True)

    with tempfile.TemporaryDirectory(prefix=f"kemix-{pair_name}-", dir=destination) as temp_dir:
        temp_path = Path(temp_dir)
        try:
            with zipfile.ZipFile(archive_path) as archive:
                _validate_archive_paths(archive)
                archive.extractall(temp_path)
                metadata_paths = list(temp_path.rglob("metadata.json"))
                if len(metadata_paths) != 1:
                    raise RuntimeError("The offline model archive has invalid metadata.")
                extracted_package = metadata_paths[0].parent
                with metadata_paths[0].open(encoding="utf-8") as metadata_file:
                    metadata = json.load(metadata_file)
                if metadata.get("from_code") != source or metadata.get("to_code") != target:
                    raise RuntimeError("The downloaded offline model has an unexpected language pair.")
                if not (extracted_package / "model" / "model.bin").is_file():
                    raise RuntimeError("The offline model archive does not contain its model weights.")
                if not (extracted_package / "sentencepiece.model").is_file():
                    raise RuntimeError("The offline model archive does not contain its tokenizer.")
                extracted_package.replace(package_path)
        except (OSError, zipfile.BadZipFile, json.JSONDecodeError) as error:
            raise RuntimeError(f"The {source}->{target} offline model archive is invalid.") from error

    logger.info("Installed the offline %s->%s model.", source, target)
    return package_path


def install_required_models() -> None:
    for source, target in MODEL_URLS:
        _download_model(source, target, MODEL_ROOT)


def get_model(source: str, target: str) -> TranslationModel:
    key = (source, target)
    with models_lock:
        if key not in models:
            package_path = MODEL_ROOT / f"{source}-{target}"
            models[key] = TranslationModel(source, target, package_path)
        return models[key]


def translate_texts(texts: list[str], source: str, target: str) -> list[str]:
    results = [""] * len(texts)
    missing_indexes: list[int] = []
    missing_texts: list[str] = []
    for index, text in enumerate(texts):
        cache_key = (source, target, text)
        with translation_cache_lock:
            cached = translation_cache.get(cache_key)
            if cached is not None:
                translation_cache.move_to_end(cache_key)
                results[index] = cached
                continue
        missing_indexes.append(index)
        missing_texts.append(text)

    if not missing_texts:
        return results

    translated_texts = get_model(source, target).translate_many(missing_texts)
    if len(translated_texts) != len(missing_indexes):
        raise RuntimeError("The offline model returned an incomplete translation batch.")

    for index, original, translated in zip(missing_indexes, missing_texts, translated_texts):
        results[index] = translated
        cache_key = (source, target, original)
        with translation_cache_lock:
            translation_cache[cache_key] = translated
            translation_cache.move_to_end(cache_key)
            while len(translation_cache) > MAX_CACHE_ENTRIES:
                translation_cache.popitem(last=False)

    return results


class TranslationHandler(BaseHTTPRequestHandler):
    server_version = "KemixLocalTranslation/1.0"

    def do_GET(self) -> None:
        if urlparse(self.path).path != "/health":
            self.send_error(404)
            return
        self._send_json(200, {"status": "ready", "engine": "Argos Translate", "offline": True})

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/translate":
            self.send_error(404)
            return

        content_length = self.headers.get("Content-Length")
        try:
            request_length = int(content_length or "0")
        except ValueError:
            self._send_json(400, {"error": "Invalid request size."})
            return
        if request_length <= 0 or request_length > MAX_BODY_BYTES:
            self._send_json(413, {"error": "Translation request is too large."})
            return

        try:
            payload = json.loads(self.rfile.read(request_length))
            if not isinstance(payload, dict):
                self._send_json(400, {"error": "Invalid translation request."})
                return
            texts = payload.get("texts")
            source = payload.get("source")
            target = payload.get("target")
            if (
                not isinstance(texts, list)
                or not texts
                or len(texts) > MAX_TEXTS
                or source not in ("ar", "en")
                or target not in ("ar", "en")
                or source == target
                or any(not isinstance(text, str) or not text.strip() for text in texts)
                or any(len(text) > MAX_TEXT_LENGTH for text in texts)
                or sum(len(text) for text in texts) > MAX_TOTAL_TEXT_LENGTH
            ):
                self._send_json(400, {"error": "Invalid translation request."})
                return

            translations = translate_texts(texts, source, target)
            self._send_json(200, {"translations": translations})
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON request."})
        except Exception:
            logger.exception("Offline translation request failed.")
            self._send_json(500, {"error": "The offline translation engine could not translate this text."})

    def log_message(self, format_string: str, *args: object) -> None:
        logger.info("%s - %s", self.address_string(), format_string % args)

    def _send_json(self, status: int, payload: dict[str, object]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)


def main() -> None:
    install_required_models()
    server = ThreadingHTTPServer((HOST, PORT), TranslationHandler)
    logger.info("Offline translation service ready at http://%s:%s.", HOST, PORT)
    server.serve_forever()


if __name__ == "__main__":
    main()
