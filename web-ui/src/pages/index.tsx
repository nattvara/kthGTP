import { Lecture } from '@/types/lecture';
import PageFrame from '@/components/page/page-frame/page-frame';
import SearchHuge from '@/components/search/search-huge/search-huge';
import { registerPageLoad } from '@/matomo';
import { Button, Col, Row } from 'antd';
import styles from './index.less';
import { useEffect, useState } from 'react';
import SearchResult from '@/components/search/search-results/search-result';
import ButtonHuge from '@/components/button/button-huge/button-huge';
import {
  BulbOutlined,
  FileSearchOutlined,
  VideoCameraAddOutlined,
} from '@ant-design/icons';
import ButtonHugeWithPreview from '@/components/button/button-huge-with-preview/button-huge-with-preview';
import apiClient from '@/http';
import CourseList from '@/components/course/course-list/course-list';
import ImageUpload from '@/components/image/image-upload/image-upload';
import { Image } from '@/types/search';
import { history } from 'umi';

const RANDOM_ASSIGNMENT_SUBJECT = 'Mathematics';

export default function IndexPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const foundLectures = (lectures: Lecture[]) => {
    setLectures(lectures);
  };

  const onImageUploadComplete = (image: Image) => {
    history.push(`/assignments/${image.id}`);
  };

  const goToRandomAssignment = async () => {
    try {
      const response = await apiClient.get(
        `/assignments/image/random/${RANDOM_ASSIGNMENT_SUBJECT}`
      );
      const id = response.data.id;
      history.push(`/assignments/${id}`);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  useEffect(() => {
    document.title = 'kthGPT';
    registerPageLoad();
  }, []);

  return (
    <>
      <PageFrame>
        <Row>
          <Row className={styles.fullwidth}>
            <SearchHuge
              className={styles.maxwidth}
              onChange={(hasInput: boolean) => setHasSearched(hasInput)}
              foundLectures={(lectures: Lecture[]) => foundLectures(lectures)}
            ></SearchHuge>
          </Row>

          {hasSearched && (
            <Row className={styles.fullwidth}>
              <SearchResult className={styles.maxwidth} lectures={lectures} />
            </Row>
          )}

          {!hasSearched && (
            <Row className={styles.fullwidth}>
              <Col sm={24} md={8}>
                <ImageUpload
                  onUploadComplete={(image) => onImageUploadComplete(image)}
                />
                <Row justify="center">
                  <Col>
                    <Button
                      onClick={() => goToRandomAssignment()}
                      type="primary"
                      size="large"
                    >
                      <BulbOutlined /> Look at a random assignment
                    </Button>
                  </Col>
                </Row>
              </Col>
              <Col sm={24} md={8}>
                <ButtonHugeWithPreview
                  icon={<FileSearchOutlined />}
                  title="Find a lecture"
                  subtitle="Find a lecture from the lectures kthGPT has already watched"
                  url="/courses"
                  preview={
                    <CourseList onCourseSelect={() => null} small={true} />
                  }
                />
              </Col>
              <Col sm={24} md={8}>
                <ButtonHuge
                  icon={<VideoCameraAddOutlined />}
                  title="Add a new lecture"
                  subtitle="It usually takes between 5 and 15 minutes"
                  url="/lectures/add"
                />
              </Col>
            </Row>
          )}
        </Row>
      </PageFrame>
    </>
  );
}
