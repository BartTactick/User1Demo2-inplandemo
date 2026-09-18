import axios from "axios";
import { createWriteStream } from "fs";
import { tmpdir } from "os";
import { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";

export async function getCRMToken(app: CatalystApp) {
  const { CRM_CLIENT_ID, CRM_CLIENT_SECRET, CRM_REFRESH_TOKEN } = process.env;

  const connector = app
    .connection({
      CRM: {
        client_id: CRM_CLIENT_ID as string,
        client_secret: CRM_CLIENT_SECRET as string,
        auth_url: "https://accounts.zoho.eu/oauth/v2/token",
        refresh_url: "https://accounts.zoho.eu/oauth/v2/token",
        refresh_token: CRM_REFRESH_TOKEN as string,
      },
    })
    .getConnector("CRM");

  return await connector.getAccessToken();
}

export async function COQLQuery(app: CatalystApp, select_query: string) {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const queryResult = await axios
    .post(
      CRM_API + "/crm/v8/coql",
      { select_query },
      {
        headers: {
          Authorization: "Zoho-oauthtoken " + token,
        },
      },
    )
    .catch((e) => {
      console.error("Could not query:", select_query);
      console.error(e.response?.data || e.response || e);
      return [];
    });

  if (Array.isArray(queryResult)) return queryResult;

  return queryResult?.data?.data || [];
}

export async function COQLQueryAll(app: CatalystApp, select_query: string) {
  let result: any[] = [],
    page = 1;

  while (true) {
    const queryRes = await COQLQuery(
      app,
      select_query + " LIMIT 2000 offset " + (page - 1) * 2000,
    ).catch((e) => console.error(e));

    if (queryRes == null) return [];

    result = result.concat(queryRes);
    page++;
    if (queryRes.length != 2000) break;
  }
  // console.log(result);
  return result as any[];
}

export async function createItems(
  app: CatalystApp,
  module: string,
  data: any[],
) {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const queryResult = await axios
    .post(
      CRM_API + "/crm/v5/" + module + "",
      {
        data,
        trigger: ["approval", "workflow", "blueprint"],
      },
      {
        headers: {
          Authorization: "Zoho-oauthtoken " + token,
        },
      },
    )
    .catch((error) => {
      console.error(
        "Could not create:",
        JSON.stringify(
          error?.response?.data || error?.response || error,
          null,
          2,
        ),
        {
          data,
          trigger: ["approval", "workflow", "blueprint"],
        },
      );
      return [];
    });

  if (Array.isArray(queryResult)) return queryResult;
  // console.log({ queryResult });

  return queryResult?.data?.data || [];
}

export async function CRMUpsert(
  app: CatalystApp,
  module: string,
  data: any[],
  checkFields: string[],
) {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const queryResult = await axios
    .post(
      CRM_API + "/crm/v5/" + module + "/upsert",
      {
        data,
        trigger: ["approval", "workflow", "blueprint"],
        duplicate_check_fields: checkFields,
      },
      {
        headers: {
          Authorization: "Zoho-oauthtoken " + token,
        },
      },
    )
    .catch((error) => {
      console.error(
        "Could not upsert:",
        JSON.stringify(
          error?.response?.data || error?.response || error,
          null,
          2,
        ),
        {
          data,
          trigger: ["approval", "workflow", "blueprint"],
          duplicate_check_fields: checkFields,
        },
      );
      return [];
    });

  if (Array.isArray(queryResult)) return queryResult;
  // console.log({ queryResult });

  return queryResult?.data?.data || [];
}

export async function getItemByID(
  app: CatalystApp,
  module: string,
  id: string,
): Promise<any[]> {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const queryResult = await axios
    .get(CRM_API + "/crm/v5/" + module + "/" + id, {
      headers: {
        Authorization: "Zoho-oauthtoken " + token,
      },
    })
    .catch((error) => {
      console.error(
        "Could not fetch:",
        {
          module,
          id,
        },
        error?.response?.data || error?.response || error,
      );
      return [];
    });

  // console.log({ queryResult });
  if (Array.isArray(queryResult)) return queryResult;

  return queryResult?.data?.data || [];
}

export async function updateItemByID(
  app: CatalystApp,
  module: string,
  id: string,
  data: any,
): Promise<any[]> {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;
  data.id = id;
  const queryResult = await axios
    .put(
      CRM_API + "/crm/v5/" + module,
      { data: [data], trigger: ["approval", "workflow", "blueprint"] },
      {
        headers: {
          Authorization: "Zoho-oauthtoken " + token,
        },
      },
    )
    .catch((error) => {
      console.error(
        "Could not update:",
        {
          module,
          id,
          data,
        },
        error?.response?.data?.data ||
          error?.response?.data ||
          error?.response ||
          error,
      );
      return [];
    });

  if (Array.isArray(queryResult)) return queryResult;
  // console.log({ queryResult });

  return queryResult?.data?.data || [];
}

export async function updateItems(
  app: CatalystApp,
  module: string,
  data: any[],
): Promise<any[]> {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const queryResult = await axios
    .put(
      CRM_API + "/crm/v5/" + module,
      { data, trigger: ["approval", "workflow", "blueprint"] },
      {
        headers: {
          Authorization: "Zoho-oauthtoken " + token,
        },
      },
    )
    .catch((error) => {
      console.error(
        "Could not fetch:",
        {
          module,
          data,
        },
        error?.response?.data?.data ||
          error?.response?.data ||
          error?.response ||
          error,
      );
      return [];
    });

  if (Array.isArray(queryResult)) return queryResult;
  // console.log({ queryResult });

  return queryResult?.data?.data || [];
}

export async function deleteItems(
  app: CatalystApp,
  module: string,
  ids: string[],
): Promise<any[]> {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const queryResult = await axios
    .delete(CRM_API + "/crm/v5/" + module + "?wf_trigger=true&ids=" + ids, {
      headers: {
        Authorization: "Zoho-oauthtoken " + token,
      },
    })
    .catch((error) => {
      console.error(
        "Could not delete:",
        {
          module,
          ids,
        },
        error?.response?.data?.data ||
          error?.response?.data ||
          error?.response ||
          error,
      );
      return [];
    });

  if (Array.isArray(queryResult)) return queryResult;
  // console.log({ queryResult });

  return queryResult?.data?.data || [];
}

export async function getAttachments(
  app: CatalystApp,
  module: string,
  id: string,
): Promise<any[]> {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const queryResult = await axios
    .get(CRM_API + "/crm/v5/" + module + "/" + id + "/Attachments", {
      headers: {
        Authorization: "Zoho-oauthtoken " + token,
      },
      params: {
        fields: "$file_id,File_Name",
      },
    })
    .catch((error) => {
      console.error(
        "Could not fetch:",
        {
          module,
          id,
        },
        error?.response?.data || error?.response || error,
      );
      return [];
    });

  if (Array.isArray(queryResult)) return queryResult;
  // console.log({ queryResult });

  return queryResult?.data?.data || [];
}

export async function downloadCRMFile(
  app: CatalystApp,
  fileID: string,
): Promise<string> {
  const token = await getCRMToken(app);
  const { CRM_API } = process.env;

  const responseResponse = await axios
    .get(CRM_API + "/crm/v6/files?id=" + fileID, {
      headers: {
        Authorization: "Zoho-oauthtoken " + token,
      },
      responseType: "stream",
    })
    .catch((error) => {
      console.error(
        "Could not fetch:",
        error?.response?.data || error?.response || error,
      );
      return [];
    });

  if (responseResponse == null || Array.isArray(responseResponse)) return "";

  const tmpdirectory = tmpdir();
  const path = tmpdirectory + "/" + fileID + ".pdf";
  const writer = createWriteStream(path);

  // Pipe the response stream to the file
  responseResponse.data.pipe(writer);

  // Return a promise that resolves when the file is finished downloading
  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(path));
    writer.on("error", reject);
  });
}
