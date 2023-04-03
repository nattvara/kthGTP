import { Lecture } from '@/components/lecture';
import Frame from '@/components/main/frame';
import SearchHuge from '@/components/searching/search-huge/search-huge';
import { registerPageLoad } from '@/matomo';
import { Col, Row } from 'antd';
import styles from './index.less';
import { useEffect, useState } from 'react';
import SearchResult from '@/components/searching/search-results/search-result';

export default function IndexPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const foundLectures = (lectures: Lecture[]) => {
    setLectures(lectures);
  };

  useEffect(() => {
    registerPageLoad();
  }, []);

  return (
    <>
      <Frame>
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
        </Row>
      </Frame>
    </>
  );
}
