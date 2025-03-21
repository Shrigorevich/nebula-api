## API Usage

1. `POST api/v1/uploads` - Initiates Google Drive uploading task for specified urls. Returns
   the ID by which you can check the status of the initiated task
2. `GET api/v1/uploads/:id/status` - Returns the status of the uploading task by specified ID
3. `GET api/v1/uploads/files` - Returns the list of uploaded files to the Google Drive

### Uploading approach

1. Server creates a separate task (bullmq Job) per each separate file.
2. Each such task is executed in the background in parallel with other tasks.
3. Files are streamed directly from the source to the cloud, without intermediate recording to a local disk
4. In case or any exceptions during uploading or after server reboot

   - For all files that support resumable downloading, the process will continue from the same place.
   - For those files that do not support - process will start from scratch.

5. Corresponding `.env` file allows to configure the `Chunk size` - the number of bytes that are loaded per iteration.
