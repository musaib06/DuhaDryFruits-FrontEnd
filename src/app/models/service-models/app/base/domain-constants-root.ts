export const DomainConstants = {
    GenericRoot: {
        LogToGhDbCompleted: "LogToGhDbCompleted",
        ExpData_TimeTakenForHttpCallMs: "TimeTakenForHttpCallMs",
        ExpData_ContentOnError: "ContentOnError",
        ExpData_IsErrorInGateway: "IsGatewayError",
        MultiForm_File_PrePend: "file-",
        MultiForm_ApiReq_KeyName: "apireq",
        AES_PasswordPrefix: "-_AE_-"
    },

    ClaimsRoot: {
        Claim_ClientCode: "clCd",
        Claim_ClientId: "clId",
        Claim_LoginUserType: "uTyp",
        Claim_DbRecordId: "dbRId"
    },

    HeadersRoot: {
        Header_CallerName: "CallerName",
        Header_SourceName: "SourceName",
        Header_CallerBaseClientVersion: "CallerBaseClientVersion",
        Header_CallerAppVersion: "AppVersion",
        Header_IsDeveloperApk: "IsDeveloperApk",
        Header_TargetApiType: "TargetApiType",
        Header_TargetCompCode: "t_ccd",
        Header_TargetCompId: "t_cid",
        Header_TargetClientEmpUserId: "t_ce_id",
        Header_Authorization: "Authorization",
        Header_Skip: "$skip",
        Header_Top: "$top",
        Header_FilterCommand: "flt_cmd",
        Header_OrderByCommand: "ord_cmd",
        Header_SearchByCommand: "srch_cmd",
        Header_SearchByText: "srch_txt",
        Header_SearchOnColumns: "srch_on",
        Header_SearchType: "srch_typ",
        Header_SearchType_Cointais: "cnt",
        Header_SearchType_StartsWith: "strt",
        Header_SearchType_EndsWith: "end",
        Header_SkipLogging: "skpLog",
        Header_TracingId: "traceid"
    },

    ClientsRoot: {
        PollyContext_ServiceUrlHit: "ServiceURLHit"
    },

    DisplayMessagesRoot: {
        Display_GlobalErrorApi: "Unknown Error Occured in Api. Please retry after sometime or contact service team.",
        Display_GlobalErrorClient: "Unknown Error Occured in Client. Please retry after sometime or contact service team.",
        Display_NoCallerName: "No or Unknown caller name found in request.",
        Display_CallerDisabled: "Requested operation disabled for caller/client.",
        Display_ReqDataNotFormed: "Check input params 'ReqData' not formed properly.",
        Display_PassedDataNotSaved: "Passed data not saved/updated, please try again later.",
        Display_IdNotFound: "Passed Id Not Found",
        Display_IdInvalid: "Passed Id is invalid, please check and try again",
        Display_IdNotInClaims: "Invalid user, Expected CompanyId Not Found In Claims",
        Display_FileNotSaved: "Passed File Could not be saved properly",
        Display_InvalidRequiredDataInputs: "Invalid Required Data",
        Display_UserNotFound: "User Not Found",
        Display_UserDisabled: "User Id Disabled",
        Display_UserPasswordResetRequired: "User Password Reset Required",
        Display_UserNotVerified: "User Not Verified"
    }
};
