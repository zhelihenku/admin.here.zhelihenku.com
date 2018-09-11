<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input placeholder="关键字" v-model="searchInfo.title" style="width: 200px;" class="filter-item"/>
      <el-select v-model="searchInfo.status" placeholder="请选择视频状态" clearable class="filter-item" style="width: 150px">
        <el-option v-for="item in systemMenuStatusOptions" :key="item.value" :label="item.name" :value="item.value"/>
      </el-select>
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="loadSystemMenuList">搜索</el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreateButton">添加</el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="Loading"
      border
      fit
      highlight-current-row>
      <el-table-column type="index" width="50" align="center">
      </el-table-column>
      <el-table-column label="菜单名称" prop="name"  align="center">
      </el-table-column>
      <el-table-column label="菜单全称" prop="fullName" align="center">
      </el-table-column>
      <el-table-column label="请求地址" prop="url" align="center">
      </el-table-column>
      <el-table-column label="层级" prop="levels" align="center">
      </el-table-column>
      <el-table-column label="排序" prop="sort" align="center">
      </el-table-column>
      <el-table-column label="是否是菜单" prop="isMenu" align="center">
      </el-table-column>
      <el-table-column label="状态" prop="status" align="center">
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="180" align="center">
      </el-table-column>
      <el-table-column label="操作" width="350" align="center">
        <template slot-scope="scope" class="changeType">
          <el-button-group>
            <el-button type="primary" size="mini" @click="handleSeeButton(scope.row)">查看</el-button>
            <el-button type="success" size="mini" @click="handleEditButton(scope.row)">编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDeleteButton(scope.row)">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <div class="block">
      <el-pagination background @size-change="handlePageSizeChange" @current-change="handlePageCurrentChange" :current-page="currentPage" :page-sizes="pageSizes" :page-size="pageSize" layout="sizes, total, prev, pager, next" :total="totalCount">
      </el-pagination>
    </div>

    <!-- 新增&编辑 -->
    <el-dialog title="角色" :visible.sync="dialogAddAndEditVisible">
      <el-form ref="addAndEditForm" :rules="rules" :model="systemMenu" label-position="left" label-width="90px" style="width: 400px; margin-left:50px;">
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="systemMenu.name"/>
        </el-form-item>
        <el-form-item label="父级菜单" >
          <el-cascader :options="menuTreeList" :props="defaultMenuProps" v-model="selectedParentMenuIds" placeholder="请选择上级角色" change-on-select clearable></el-cascader>
        </el-form-item>
        <el-form-item label="路由地址" prop="url">
          <el-input v-model="systemMenu.url"/>
        </el-form-item>
        <el-form-item label="菜单图标">
          <el-input v-model="systemMenu.icon"/>
        </el-form-item>
        <el-form-item label="菜单层级">
          <el-input v-model="systemMenu.levels"/>
        </el-form-item>
        <el-form-item label="是否是菜单">
          <el-switch
            v-model="systemMenu.isMenu?true:false"
            active-color="#13ce66"
            inactive-color="#ff4949">
          </el-switch>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="systemMenu.desc"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogAddAndEditVisible = false">取消</el-button>
        <el-button v-if="isAddDialog" type="primary" @click="postAddOrEditSystemMenu">添加</el-button>
        <el-button v-else type="primary" @click="postAddOrEditSystemMenu">编辑</el-button>
      </div>
    </el-dialog>
    <!-- 新增&编辑 -->

    <!-- 查看 -->
    <el-dialog title="部门" :visible.sync="dialogDetailVisible">
      <el-form ref="dataForm" :model="systemMenu" label-position="left" label-width="90px" style="width: 400px; margin-left:150px;">
        <el-form-item label="角色名称">
          <el-input v-model="systemMenu.name" :disabled="true"/>
        </el-form-item>
        <el-form-item label="角色全称">
          <el-input v-model="systemMenu.fullName" :disabled="true"/>
        </el-form-item>
        <el-form-item label="路由地址">
          <el-input v-model="systemMenu.url" :disabled="true"/>
        </el-form-item>
        <el-form-item label="菜单图标">
          <el-input v-model="systemMenu.icon" :disabled="true"/>
        </el-form-item>
        <el-form-item label="菜单层级">
          <el-input v-model="systemMenu.levels" :disabled="true"/>
        </el-form-item>
        <el-form-item label="是否是菜单"><el-switch
          v-model="systemMenu.isMenu?true:false"
          active-color="#13ce66"
          inactive-color="#ff4949"
        :disabled="true">
        </el-switch>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input v-model="systemMenu.createTime" :disabled="true"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="systemMenu.desc" :disabled="true"/>
        </el-form-item>
      </el-form>
    </el-dialog>
    <!-- 查看 -->

  </div>
</template>

<script>
  import httpClient from '@/utils/httpClient'

  export default {
    filters: {
      statusFilter(status) {
        const statusMap = {
          0: 'primary',
          1: 'warning',
        }
        return statusMap[status]
      }
    },
    data() {
      return {
        pageSizes: [10, 20, 30, 40], // 每页多少条
        pageSize: 10, // 每页多少条
        currentPage: 1, // 第几页
        totalCount: 0, // 总条数

        defaultDepartmentProps: {
          children: 'childDepartments',
          label: 'name',
          value: 'id',
        },
        defaultMenuProps: {
          children: 'childMenus',
          label: 'name',
          value: 'id',
        },

        rules: {
          name: [{ required: true, message: '部门名称是必填项', trigger: 'blur' }],
        },

        systemMenuStatusOptions: [
          {
            name:'上架',
            value: '0'
          },
          {
            name:'下架',
            value: '1'
          }
        ],

        searchInfo:{
          title: '',
          status: '',
        },

        listLoading: true,
        dialogDetailVisible: false,
        dialogAddAndEditVisible: false,
        isAddDialog: true,

        list: null,
        menuTreeList: [],
        deptTreeList: [],
        systemMenu: {
          id: undefined,
          name: '',
          pid: '',
          url: '',
          icon: '',
          levels: '',
          isMenu: true,
          desc: '',
        },
        selectedParentMenuIds: [],
        selectedDeptIds: [],
      }
    },
    created() {
      this.loadSystemMenuList()
    },
    methods: {
      handleSeeButton(info) {
        this.systemMenu = Object.assign({}, info) // copy obj
        this.dialogDetailVisible = true
      },
      handleCreateButton() {
        this.selectedParentMenuIds = [];
        this.selectedDeptIds = [];
        this.systemMenu = {
          id: undefined,
          name: '',
          pid: '',
          url: '',
          icon: '',
          levels: '',
          isMenu: true,
          desc: '',
        };
        this.isAddDialog = true;
        this.loadSystemMenuTreeList();

        this.dialogAddAndEditVisible = true;
        this.$nextTick(() => {
          this.$refs['addAndEditForm'].clearValidate()
        })
      },
      handleEditButton(info) {
        this.systemMenu = Object.assign({}, info) // copy obj

        var tempMenuIds = this.systemMenu.pids.split(',');
        if (tempMenuIds.length > 0 && tempMenuIds[0] == 0) {
          tempMenuIds.splice(0, 1);
        }
        var tempSelectedParentMenuIds = [];
        for (let i = 0; i < tempMenuIds.length - 1; i++) {
          let tempMenuId = tempMenuIds[i];
          tempSelectedParentMenuIds.push(parseInt(tempMenuId));
        }
        this.selectedParentMenuIds = tempSelectedParentMenuIds;

        this.isAddDialog = false;

        this.loadSystemMenuTreeList();

        this.dialogAddAndEditVisible = true;
        this.$nextTick(() => {
          this.$refs['addAndEditForm'].clearValidate()
        })
      },
      handleDeleteButton(info) {
        this.$confirm('确认删除？')
          .then(_ => {
            var params = {
              ids: [info.id],
            }

            this.postDeletesystemMenu(params)
            done();
          })
          .catch(_ => {});
      },
      loadSystemMenuList() {
        this.listLoading = true
        var params = {
          index: this.currentPage,
          pageSize: this.pageSize,
          title: this.searchInfo.title,
          status: this.searchInfo.status,
        }
        // console.log("loadSystemMenuList params is : ", params);

        httpClient.post("/api/systemMenu/pageList", params, true).then(response => {
          console.log("loadSystemMenuList response is : ", response);
          this.listLoading = false;
          this.list = response.data.records;
          this.totalCount = parseInt(response.data.total);
        }).catch(error => {
          this.listLoading = false;
        })
      },
      loadSystemMenuTreeList() {
        this.listLoading = true
        var params = {}

        httpClient.post("/api/systemMenu/treeList", params, true).then(response => {
          console.log("loadsystemMenuTreeList response is : ", response);
          this.listLoading = false;
          this.menuTreeList = response.data;
        }).catch(error => {
          this.listLoading = false;
        })
      },
      postAddOrEditSystemMenu() {
        this.$refs['addAndEditForm'].validate((valid) => {
          if (valid) {

            let pid = 0;
            if (this.selectedParentMenuIds.length > 0) {
              pid =  this.selectedParentMenuIds[this.selectedParentMenuIds.length - 1];
            }

            this.listLoading = true
            let params = {
              name: this.systemMenu.name,
              pid: pid,
              url: this.systemMenu.url,
              icon: this.systemMenu.icon,
              levels: this.systemMenu.levels,
              isMenu: this.systemMenu.isMenu?1:0,
              desc: this.systemMenu.desc,
            }

            let url = '';
            if (this.isAddDialog) {
              url = "/api/systemMenu/add";
            } else {
              url = "/api/systemMenu/update";
              params.id = this.systemMenu.id;
            }

            console.log("postAddOrEditsystemMenu params is : ", params);
            httpClient.post(url, params, true).then(response => {
              // console.log("postAddOrEditsystemMenu response is : ", response);
              this.listLoading = false;
              if (response.code == 0) {
                this.dialogAddAndEditVisible = false
                this.loadSystemMenuList();
              }
            }).catch(error => {
              this.listLoading = false;
            })
          }
        })
      },
      postDeletesystemMenu(params) {
        // console.log("postDeletesystemMenu params is : ", params);
        this.listLoading = true
        httpClient.post("/api/systemMenu/delete", params, true).then(response => {
          // console.log("postDeletesystemMenu response is : ", response);
          this.listLoading = false;
          if (response.code == 0) {
            this.loadSystemMenuList();
          }
        }).catch(error => {
          this.listLoading = false;
        })
      },
      handlePageSizeChange(val) {
        this.pageSize = val;
        this.loadSystemMenuList();
      },
      handlePageCurrentChange(val) {
        this.currentPage = val;
        this.loadSystemMenuList();
      }
    }
  }
</script>

<style scoped>
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
</style>
