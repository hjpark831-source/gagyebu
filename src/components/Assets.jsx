import Icon from './Icons.jsx';

export default function Assets() {
  return (
    <section className="screen">
      <div className="title-row title-row-top">
        <h1 className="page-title">
          <small>모은 돈과 갚을 돈</small>
          자산
        </h1>
      </div>
      <div className="soon-card">
        <span className="soon-icon">
          <Icon name="assets" size={34} stroke={1.5} />
        </span>
        <p className="soon-title">자산 탭은 다음 단계에서 만들어요</p>
        <p>
          자유입출금, 적금, 예금, 주식, 코인, 연금, 보험, 대출을 직접 입력하면 총자산과 순자산을 한눈에 보여줄 거예요.
        </p>
      </div>
    </section>
  );
}
