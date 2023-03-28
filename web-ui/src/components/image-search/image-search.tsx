import styles from './image-search.less';
import {
  Row,
  Col,
  Alert,
  Upload,
  Image,
  Space,
  Typography,
  notification,
} from 'antd';
import type { UploadProps } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import apiClient, {
  makeUrl,
  ServerErrorResponse,
  ServerResponse,
} from '@/http';
import { FileImageOutlined } from '@ant-design/icons';
import {
  emitEvent,
  CATEGORY_IMAGE_SEARCH,
  EVENT_ERROR_RESPONSE,
} from '@/matomo';
import { UploadChangeParam, UploadFile } from 'antd/es/upload';
import { Image as ImageType } from '../search';
import QuestionInput from '../question-input/question-input';

const { Dragger } = Upload;

const { Paragraph } = Typography;

const UPDATE_INTERVAL = 1000;

const DEFAULT_QUERY_STRING = 'Where can I find the answer to this assignment?';

interface ImageResponse extends ServerResponse {
  data: ImageType;
}

export default function ImageSearch() {
  const [id, setId] = useState<null | string>(null);
  const [error, setError] = useState<string>('');
  const [image, setImage] = useState<null | ImageType>(null);
  const [queryString, setQueryString] = useState<string>('');
  const [notificationApi, contextHolder] = notification.useNotification();

  const previewUrl = makeUrl(`/search/image/${id}/img`);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    action: makeUrl('/search/image'),
    maxCount: 1,
    onChange(info: UploadChangeParam<UploadFile<T>>) {
      const { status } = info.file;
      if (status === 'done') {
        setId(info.file.response.id);
        setError('');
      } else if (status === 'error') {
        emitEvent(CATEGORY_IMAGE_SEARCH, EVENT_ERROR_RESPONSE, 'upload');
        setError(info.file.response.detail);
      }
    },
  };

  const { mutate: fetchImage } = useMutation(
    async () => {
      return await apiClient.get(`/search/image/${id}`);
    },
    {
      onSuccess: (res: ImageResponse) => {
        const result = {
          status: res.status + '-' + res.statusText,
          headers: res.headers,
          data: res.data,
        };
        setImage(result.data);
      },
      onError: (err: ServerErrorResponse) => {
        notificationApi['error']({
          message: 'Failed to get lectures',
          description: err.response.data.detail,
        });
        emitEvent(CATEGORY_IMAGE_SEARCH, EVENT_ERROR_RESPONSE, 'fetchImage');
      },
    }
  );

  const { isLoading: isAskingQuestion, mutate: sendQuestion } = useMutation(
    async () => {
      return await apiClient.post(`/search/image/${id}/questions`, {
        query: queryString,
      });
    },
    {
      onSuccess: (res: ImageResponse) => {
        const result = {
          status: res.status + '-' + res.statusText,
          headers: res.headers,
          data: res.data,
        };
        console.log(result);
      },
      onError: (err: ServerErrorResponse) => {
        console.error(err);
      },
    }
  );

  useEffect(() => {
    if (id !== null) fetchImage();
  }, [id, fetchImage]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (id !== null) fetchImage();
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [id, fetchImage]);

  const askQuestion = async (q: string) => {
    await setQueryString(q);

    if (isAskingQuestion) return;

    sendQuestion();
  };

  return (
    <div className={styles.image_search}>
      {contextHolder}
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row>
          {(id === null || image === null) && (
            <Dragger className={styles.dragger} {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <FileImageOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag image to this area to upload
              </p>
            </Dragger>
          )}
          {!(id === null || image === null) && (
            <Dragger className={styles.dragger} {...uploadProps}>
              <Image height={200} src={previewUrl} preview={false} />
            </Dragger>
          )}
        </Row>
        <Row>
          {error !== '' && (
            <Row justify="center">
              <Col>
                <Alert
                  message="The image was not accepted"
                  description={error}
                  type="error"
                  showIcon
                />
              </Col>
            </Row>
          )}
        </Row>
        <div className={styles.question_box}>
          <QuestionInput
            language={'en'}
            placeholder={'Enter a question about this image...'}
            disabled={id === null}
            defaultQueryString={DEFAULT_QUERY_STRING}
            isAsking={isAskingQuestion}
            examples={[
              {
                titleEn: 'Help me find the answer',
                titleSv: '',
                queryStringEn:
                  'Where can I find the answer to this assignment?',
                queryStringSv: '',
              },
              {
                titleEn: 'Find similar assignments',
                titleSv: '',
                queryStringEn:
                  'Where can I find similar assignments to this question?',
                queryStringSv: '',
              },
            ]}
            huge={false}
            onAsk={(queryString: string) => askQuestion(queryString)}
          />
          {image !== null && (
            <Row className={styles.description}>
              <Paragraph>
                <blockquote>Description: {image.description}</blockquote>
              </Paragraph>
            </Row>
          )}
        </div>
      </Space>
    </div>
  );
}
