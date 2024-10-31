import React, { useState } from 'react';
import { db, storage } from '../firebase';
import Popup from './layout/Popup';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AddBlog = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleAddBlog = async () => {
    if (!title || !description || !image) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // Upload ảnh lên Firebase Storage
    const storageRef = storage.ref();
    const imageRef = storageRef.child(`blog_images/${image.name}`);
    await imageRef.put(image);
    const imageUrl = await imageRef.getDownloadURL();

    // Lưu thông tin blog vào Firestore
    await db.collection('blogs').add({
      title,
      description,
      image: imageUrl,
    });

    // Xóa dữ liệu form và đóng popup
    setTitle('');
    setDescription('');
    setImage(null);
    setIsPopupOpen(false);
    alert('Thêm blog thành công!');
  };

  const modules = {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'align': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean'] // Xóa định dạng
    ]
  };

  return (
    <div>
      {/* Nút Thêm Blog để mở Popup */}
      <button
        onClick={() => setIsPopupOpen(true)}
        className="bg-blue-500 text-white p-2 rounded mb-4"
      >
        Hôm nay bạn nghĩ gì?
      </button>

      {/* Popup Form Thêm Blog */}
      <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)}>
        <h2 className="text-2xl font-semibold mb-8">Thêm Blog Mới</h2>
        <input
          type="text"
          placeholder="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded outline-none flex-1 p-2 w-full mb-2 "
        />
        <div className='mb-2'>
            <ReactQuill
            value={description}
            onChange={setDescription}
            modules={modules}
            className="h-64 mb-20"
            placeholder="Viết nội dung tại đây"
            />
        </div>
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="border-none p-2 w-full mb-4"
        />
        <div className='flex justify-end'>
            <button
            onClick={handleAddBlog}
            className="bg-primary-500 text-white p-2 rounded "
            >
            Đăng blog
            </button>
        </div>
      </Popup>
    </div>
  );
};

export default AddBlog;
