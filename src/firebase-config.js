// Firebase 프로젝트 설정값. Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)에서 복사한 값을 넣는다.
// 이 값들은 공개돼도 괜찮다. 데이터는 Firestore 보안 규칙으로 내 구글 계정만 읽고 쓸 수 있게 막는다.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
