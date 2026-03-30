function MainPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">مین پیج</h2>
      <div className="border p-4 bg-white shadow">
        <span className="block mb-2">ریکارڈ شروع کریں</span>
        <span className="block mb-2">ریکارڈ ختم کریں</span>
        <audio controls></audio>
      </div>
    </div>
  );
}
export default MainPage;
