type Props = {
    show: boolean
    handleClose: () => void
    formik: any
}



const ChangePasswordModal: React.FC<Props> = ({ show, handleClose, formik }) => {
    if (!show) return null

    return (
        <>
            {/* backdrop */}
            <div className="modal-backdrop fade show" />

            <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Change Password</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleClose}
                            />
                        </div>

                        <div className="modal-body">
                            {/* form change password */}
                            <div className="mb-3">
                                <label className="form-label">New Password</label>
                                <div className="fv-row mb-7">
                                    <label className="required fw-bold fs-6 mb-2">Password</label>
                                    <input
                                        {...formik.getFieldProps('new_password')}
                                        className="form-control form-control-solid"
                                        type="password"
                                        // disabled={isSubmitting || isUserLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-light" onClick={handleClose}>
                                Cancel
                            </button>
                            <button className="btn btn-primary">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}


export default ChangePasswordModal
