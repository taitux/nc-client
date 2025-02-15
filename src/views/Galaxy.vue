<template>
  <div class="galaxy">
    <h1>{{ $t("Galaxy") }}</h1>
    <p>
      <i>{{ $t("Click to see details. Double click to move.") }}</i>
    </p>
    <template v-if="this.galaxy != null">
      <table>
        <tbody>
          <tr v-for="y in areaHeight" :key="y">
            <td
              @click="focus(x, y)"
              v-on:dblclick="goTo(coordinateX(x), coordinateY(y))"
              v-for="x in areaWidth"
              :key="x"
            >
              <span v-if="focusX === coordinateX(x) && focusY == coordinateY(y)"
                ><font color="green">
                  <span v-if="lookupLocation(x, y) === 'space'">&nbsp;</span>
                  <magnify-icon
                    v-if="lookupLocation(x, y) === 'explore'"
                    :title="$t('Exploring')"
                  />
                  <texture-icon
                    v-if="lookupLocation(x, y) === 'fog'"
                    :title="$t('Fog')"
                  />
                  <earth-icon
                    v-if="lookupLocation(x, y) === 'home'"
                    :title="$t('Home')"
                  />
                  <circle-icon
                    v-if="lookupLocation(x, y) === 'planet'"
                    :title="$t('Planet')"
                  /> </font
              ></span>
              <span v-else>
                <span v-if="lookupLocation(x, y) === 'space'">&nbsp;</span>
                <magnify-icon
                  v-if="lookupLocation(x, y) === 'explore'"
                  :title="$t('Exploring')"
                />
                <texture-icon
                  v-if="lookupLocation(x, y) === 'fog'"
                  :title="$t('Fog')"
                />
                <circle-icon
                  v-if="lookupLocation(x, y) === 'planet'"
                  :title="$t('Planet')"
                />
                <earth-icon
                  v-if="lookupLocation(x, y) === 'home'"
                  :title="$t('Home')"
                />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <input v-model="search" placeholder="(x/y)" />
      <button @click="goToSearch(search)">
        <target-variant-icon :title="$t('Focus')" />
      </button>
      <button @click="goTo(posX, posY)">
        <earth-icon :title="$t('Home')" />
      </button>
      <button @click="goFleet(focusX, focusY)">
        <ship-wheel-icon :title="$t('Fleet')" />
      </button>
      {{ distance().toFixed(2) }}
      <div>
        <br />
        <table v-if="planet !== null">
          <tr>
            <td>{{ planet.planet_id }}</td>
          </tr>
          <tr>
            <td>{{ $t(planet.planet_rarity) }}</td>
          </tr>
          <tr>
            <td>{{ $t(planet.planet_type) }}</td>
          </tr>
          <tr>
            <td>{{ planet.planet_name }}</td>
          </tr>
          <tr>
            <td>{{ planet.user }}</td>
          </tr>
        </table>
      </div>
    </template>
  </div>
</template>

<script>
import GalaxyService from "@/services/galaxy";
import PlanetsService from "@/services/planets";
import { mapState } from "vuex";
import CircleIcon from "vue-material-design-icons/Circle.vue";
import MagnifyIcon from "vue-material-design-icons/Magnify.vue";
import TextureIcon from "vue-material-design-icons/Texture.vue";
import EarthIcon from "vue-material-design-icons/Earth.vue";
import TargetVariantIcon from "vue-material-design-icons/TargetVariant.vue";
import ShipWheelIcon from "vue-material-design-icons/ShipWheel.vue";
import * as types from "@/store/mutation-types";

export default {
  name: "galaxy",
  components: {
    CircleIcon,
    MagnifyIcon,
    TextureIcon,
    EarthIcon,
    TargetVariantIcon,
    ShipWheelIcon
  },
  data: function() {
    return {
      galaxy: null,
      focusX: null,
      focusY: null,
      search: null,
      planet: null,
      areaHeight: 22,
      areaWidth: 22
    };
  },
  async mounted() {
    await this.prepareComponent();
    this.$store.subscribe(mutation => {
      switch (mutation.type) {
        case "planet/" + types.SET_PLANET_POSY:
          this.prepareComponent();
      }
    });
  },
  computed: {
    ...mapState({
      loginUser: state => state.game.loginUser,
      accessToken: state => state.game.accessToken,
      gameUser: state => state.game.user,
      planetId: state => state.planet.id,
      posX: state => state.planet.posX,
      posY: state => state.planet.posY,
      planetList: state => state.planet.list
    })
  },
  methods: {
    async prepareComponent() {
      await this.getGalaxy();
    },
    async getGalaxy() {
      var xCoordinate = 0;
      var yCoordinate = 0;
      if (this.planetId !== null) {
        xCoordinate = this.posX;
        yCoordinate = this.posY;
        this.focusX = xCoordinate;
        this.focusY = yCoordinate;
        this.search = "(" + this.focusX + "/" + this.focusY + ")";
      }
      if (
        (this.$route.query.x !== undefined && this.$route.query.x !== null) &
        (this.$route.query.y !== undefined && this.$route.query.y !== null)
      ) {
        xCoordinate = this.$route.query.x;
        yCoordinate = this.$route.query.y;
        this.focusX = xCoordinate;
        this.focusY = yCoordinate;
        this.search = "(" + this.focusX + "/" + this.focusY + ")";
      }
      const response = await GalaxyService.area(
        xCoordinate,
        yCoordinate,
        this.areaHeight,
        this.areaWidth
      );
      this.galaxy = response;
    },
    async getPlanet(planetId) {
      const response = await PlanetsService.byId(planetId);
      this.planet = response;
    },
    coordinateX(tableX) {
      return this.galaxy.area.xmin + tableX;
    },
    coordinateY(tableY) {
      return this.galaxy.area.ymax - tableY;
    },
    focus(tableX, tableY) {
      this.focusX = this.coordinateX(tableX);
      this.focusY = this.coordinateY(tableY);
      this.search = "(" + this.focusX + "/" + this.focusY + ")";
      this.locationDetail(tableX, tableY);
    },
    locationDetail(tableX, tableY) {
      let posX = this.coordinateX(tableX);
      let posY = this.coordinateY(tableY);
      this.planet = null;

      this.galaxy.planets.forEach(planet => {
        if (planet.x === posX && planet.y === posY) {
          this.getPlanet(planet.id);
        }
      });
    },
    lookupLocation(tableX, tableY) {
      let posX = this.coordinateX(tableX);
      let posY = this.coordinateY(tableY);
      let icon = "fog";

      this.galaxy.explore.forEach(explore => {
        if (explore.x === posX && explore.y === posY) {
          icon = "explore";
        }
      });

      this.galaxy.explored.forEach(explored => {
        if (explored.x === posX && explored.y === posY) {
          icon = "space";
        }
      });

      this.galaxy.planets.forEach(planet => {
        if (planet.x === posX && planet.y === posY) {
          icon = "planet";
        }
      });

      this.galaxy.planets.forEach(planet => {
        this.planetList.forEach(ownPlanet => {
          if (
            planet.x === posX &&
            planet.y === posY &&
            planet.id === ownPlanet.id
          ) {
            icon = "home";
          }
        });
      });

      return icon;
    },
    goTo(realX, realY) {
      let newPath = this.$route.path;
      this.$router.push({
        path: newPath,
        query: { x: realX, y: realY }
      });
      this.getGalaxy();
    },
    goToSearch(search) {
      let split = search
        .replace("(", "")
        .replace(")", "")
        .replace(/\s+/g, "")
        .split("/");
      this.goTo(split[0], split[1]);
    },
    goFleet(realX, realY) {
      let newPath = this.$route.path.replace("galaxy", "fleet");
      this.$router.push({
        path: newPath,
        query: { x: realX, y: realY }
      });
    },
    distance() {
      var a = this.posX - this.focusX;
      var b = this.posY - this.focusY;

      return Math.sqrt(a * a + b * b);
    }
  }
};
</script>
