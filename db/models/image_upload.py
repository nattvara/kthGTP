from fastapi import UploadFile
import peewee
import pytz
import uuid

from tools.files.paths import (
    writable_image_upload_filepath,
    get_sha_of_binary_file,
)
from .base import Base
from db.crud import (
    get_mathpix_requests_by_image_upload_id
)


class ImageUpload(Base):
    public_id = peewee.CharField(null=False, unique=True)
    image_sha = peewee.CharField(null=True, unique=True)
    file_format = peewee.CharField(null=False)
    text_content = peewee.TextField(null=True)
    description = peewee.TextField(null=True)
    search_queries_en = peewee.BlobField(null=True)
    search_queries_sv = peewee.BlobField(null=True)

    # image_search steps
    parse_image_content_ok = peewee.BooleanField(null=True)
    parse_image_content_failure_reason = peewee.TextField(null=True)
    create_description_ok = peewee.BooleanField(null=True)
    create_description_failure_reason = peewee.TextField(null=True)


    @staticmethod
    def make_public_id() -> str:
        return str(uuid.uuid4())

    def refresh(self):
        update = ImageUpload.get(self.id)
        self.file_format = update.file_format
        self.text_content = update.text_content
        self.description = update.description
        self.search_queries_en = update.search_queries_en
        self.search_queries_sv = update.search_queries_sv
        self.parse_image_content_ok = update.parse_image_content_ok
        self.parse_image_content_failure_reason = update.parse_image_content_failure_reason
        self.create_description_ok = update.create_description_ok
        self.create_description_failure_reason = update.create_description_failure_reason

    def mathpix_requests(self) -> list:
        return list(get_mathpix_requests_by_image_upload_id(self.id))

    def get_filename(self) -> str:
        return writable_image_upload_filepath(self.public_id, self.file_format)

    def save_image_data(self, upload: UploadFile):
        with open(self.get_filename(), 'wb+') as img:
            img.write(upload.file.read())

        self.image_sha = get_sha_of_binary_file(self.get_filename())
        self.save()

    def to_dict(self):
        tz = pytz.timezone('UTC')
        created_at = tz.localize(self.created_at, is_dst=None)
        modified_at = tz.localize(self.modified_at, is_dst=None)

        return {
            'id': self.public_id,
            'created_at': created_at.isoformat(),
            'modified_at': modified_at.isoformat(),
            'text_content': self.text_content,
            'description': self.description,
            'parse_image_content_ok': self.parse_image_content_ok,
        }