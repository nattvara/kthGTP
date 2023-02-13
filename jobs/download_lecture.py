from config.settings import settings
from redis import Redis
from rq import Queue
import logging

from tools.web.downloader import download_mp4_from_m3u8
from db.crud import get_lecture_by_public_id_and_language
from tools.web.crawler import get_m3u8
from db.models import Lecture, Analysis
import jobs.download_lecture


# 20min timeout
TIMEOUT = 20 * 60


def job(lecture_id: str, language: str):
    logger = logging.getLogger('rq.worker')

    lecture = get_lecture_by_public_id_and_language(lecture_id, language)
    if lecture is None:
        raise ValueError(f'lecture {lecture_id} not found')

    lecture.refresh()
    analysis = lecture.get_last_analysis()
    analysis.state = Analysis.State.DOWNLOADING
    analysis.mp4_progress = 1
    analysis.save()

    try:
        url = lecture.content_link()

        lecture.refresh()
        analysis.mp4_progress = 2
        analysis.save()

        logger.info(f'fetching content link at {url}')
        m3u8_url = get_m3u8(url)
        logger.info(f'found {m3u8_url}')

        lecture.refresh()
        analysis.mp4_progress = 3
        analysis.save()

        download_mp4_from_m3u8(m3u8_url, lecture)

        lecture.refresh()
        analysis = lecture.get_last_analysis()
        analysis.state = Analysis.State.IDLE
        analysis.mp4_progress = 100
        analysis.save()

        logger.info('queueing extraction job')
        logger.info('done')

    except Exception as e:
        logger.error(e)

        lecture.refresh()
        analysis = lecture.get_last_analysis()
        analysis.state = Analysis.State.FAILURE
        analysis.save()
        raise e


# Test run the job
if __name__ == '__main__':
    queue = Queue(connection=Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
    ))
    queue.enqueue(jobs.download_lecture.job, '0_blzql89t', Lecture.Language.ENGLISH)
